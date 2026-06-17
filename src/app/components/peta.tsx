import { memo, useEffect, useState, useMemo } from "react";
import { Reveal } from "./reveal";
import { MapContainer, TileLayer, GeoJSON, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { useThemeStore } from "../../stores/useThemeStore";
import { supabase } from "../../lib/supabase";
import { Link } from "react-router";

export const KalimantanMap = memo(function KalimantanMap({
  dbData,
  selectedBpsCode,
  onSelectRegion,
}: {
  dbData?: Map<string, {
    name: string;
    province: string;
    cluster_label: number;
    predicted_yield: number | null;
    centroid_lat?: number | null;
    centroid_lng?: number | null;
  }>;
  selectedBpsCode: string | null;
  onSelectRegion?: (bpsCode: string | null) => void;
}) {
  const { theme } = useThemeStore();
  const [kabGeoData, setKabGeoData] = useState<any>(null);
  const [provGeoData, setProvGeoData] = useState<any>(null);
  const [internalDbData, setInternalDbData] = useState<Map<string, {
    name: string;
    province: string;
    cluster_label: number;
    predicted_yield: number | null;
    centroid_lat?: number | null;
    centroid_lng?: number | null;
  }>>(new Map());

  const activeDbData = dbData || internalDbData;

  useEffect(() => {
    // Fetch Regencies GeoJSON
    fetch("/kalimantan_kab.json")
      .then((res) => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then((data) => setKabGeoData(data))
      .catch((err) => console.error("Error loading Regencies GeoJSON:", err));

    // Fetch Provinces GeoJSON
    fetch("/kalimantan.json")
      .then((res) => {
        if (!res.ok) throw new Error("HTTP error " + res.status);
        return res.json();
      })
      .then((data) => setProvGeoData(data))
      .catch((err) => console.error("Error loading Provinces GeoJSON:", err));
  }, []);

  useEffect(() => {
    if (dbData) return; // Skip internal fetch if data is provided via props

    async function fetchInternalData() {
      try {
        const [regionsRes, clustersRes, predictionsRes] = await Promise.all([
          supabase.from("regions").select("id, bps_code, name, province, centroid_lat, centroid_lng"),
          supabase.from("cluster_assignments").select("region_id, cluster_label"),
          supabase.from("predictions").select("region_id, predicted_yield").eq("target_year", 2026).eq("model_name", "lstm")
        ]);

        if (regionsRes.error) throw regionsRes.error;
        if (clustersRes.error) throw clustersRes.error;
        if (predictionsRes.error) throw predictionsRes.error;

        const regions = regionsRes.data || [];
        const clusters = clustersRes.data || [];
        const predictions = predictionsRes.data || [];

        const tempMap = new Map<string, any>();
        regions.forEach((r) => {
          tempMap.set(r.bps_code, {
            name: r.name,
            province: r.province,
            cluster_label: 2, // Default to Low
            predicted_yield: null,
            centroid_lat: r.centroid_lat ? Number(r.centroid_lat) : null,
            centroid_lng: r.centroid_lng ? Number(r.centroid_lng) : null,
          });
        });

        clusters.forEach((c) => {
          const region = regions.find((r) => r.id === c.region_id);
          if (region) {
            const entry = tempMap.get(region.bps_code);
            if (entry) entry.cluster_label = c.cluster_label;
          }
        });

        predictions.forEach((p) => {
          const region = regions.find((r) => r.id === p.region_id);
          if (region) {
            const entry = tempMap.get(region.bps_code);
            if (entry) entry.predicted_yield = Number(p.predicted_yield);
          }
        });

        setInternalDbData(tempMap);
      } catch (err) {
        console.error("Error fetching internal map data from Supabase:", err);
      }
    }

    fetchInternalData();
  }, [dbData]);

  const getRegencyColor = (clusterLabel: number, isDark: boolean) => {
    if (clusterLabel === 0) return "#C9A24B"; // Gold / Tinggi
    if (clusterLabel === 1) return "#7E8E78"; // Sage / Sedang
    return isDark ? "#4B5651" : "#A3B0A7"; // Slate / Rendah
  };

  const getPriorityText = (clusterLabel: number) => {
    if (clusterLabel === 0) return "Tinggi";
    if (clusterLabel === 1) return "Sedang";
    return "Rendah";
  };

  const onEachRegencyFeature = (feature: any, layer: any) => {
    const bpsCode = feature.properties.CC_2 || "";
    const regName = feature.properties.NAME_2 || "";
    const provName = feature.properties.NAME_1 || "";
    
    // Look up in database data
    const dbEntry = activeDbData.get(bpsCode);
    const clusterLabel = dbEntry ? dbEntry.cluster_label : 2;
    const yieldVal = dbEntry && dbEntry.predicted_yield 
      ? `${dbEntry.predicted_yield.toFixed(2)} t/ha` 
      : "Tidak ada data";
    
    const priority = getPriorityText(clusterLabel);
    const color = getRegencyColor(clusterLabel, theme === "dark");

    layer.bindPopup(
      `
      <div class="custom-popup-content">
        <h3 class="popup-title" style="color: ${color};">${regName}</h3>
        <p class="popup-province" style="margin: 0; font-size: 10px; text-transform: uppercase; color: #8A958E;">${provName}</p>
        <div style="margin-top: 6px; border-top: 1px solid rgba(140, 110, 38, 0.15); padding-top: 6px;">
          <p class="popup-priority" style="margin: 0;">Prioritas: <strong style="color: ${color};">${priority}</strong></p>
          <p class="popup-yield" style="margin: 4px 0 0 0;">Estimasi Yield: <strong>${yieldVal}</strong></p>
        </div>
      </div>
      `,
      {
        className: "custom-leaflet-popup",
      }
    );

    layer.setStyle({
      fillColor: color,
      weight: 0.6,
      opacity: 0.65,
      color: theme === "dark" ? "#1B2A25" : "#E2DCD0",
      fillOpacity: 0.55,
    });

    layer.on({
      mouseover: (e: any) => {
        const l = e.target;
        l.setStyle({
          fillOpacity: 0.8,
          weight: 1.5,
          color: "#C9A24B",
        });
        l.bringToFront();
      },
      mouseout: (e: any) => {
        const l = e.target;
        l.setStyle({
          fillOpacity: 0.55,
          weight: 0.6,
          color: theme === "dark" ? "#1B2A25" : "#E2DCD0",
        });
      },
      click: (e: any) => {
        if (onSelectRegion) {
          onSelectRegion(bpsCode);
        }
      }
    });
  };

  const tileUrl =
    theme === "dark"
      ? "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
      : "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";

  const key = theme; // Force map to re-render when theme changes

  // Dynamic borders style for provinces layer
  const provinceStyle = {
    fillColor: "transparent",
    fillOpacity: 0,
    weight: 2.2,
    color: theme === "dark" ? "#C9A24B" : "#8C6E26",
    opacity: 0.65,
    interactive: false,
  };

  const bounds: [[number, number], [number, number]] = [
    [-6.5, 107.0],
    [5.5, 120.5]
  ];

  return (
    <div data-lenis-prevent className="h-[420px] w-full rounded-xl overflow-hidden border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#F7F3EA] dark:bg-[#0F181B] relative z-0">
      <style>{`
        .custom-leaflet-popup .leaflet-popup-content-wrapper {
          background: ${theme === "dark" ? "rgba(15, 24, 27, 0.95)" : "rgba(247, 243, 234, 0.95)"} !important;
          backdrop-filter: blur(8px);
          border: 1px solid ${theme === "dark" ? "rgba(201, 162, 75, 0.25)" : "rgba(140, 110, 38, 0.25)"} !important;
          border-radius: 10px;
          box-shadow: 0 10px 25px -10px rgba(0, 0, 0, 0.5);
          color: ${theme === "dark" ? "#E8E6DF" : "#2A3530"} !important;
          padding: 2px;
        }
        .custom-leaflet-popup .leaflet-popup-tip {
          background: ${theme === "dark" ? "#0F181B" : "#F7F3EA"} !important;
          border: 1px solid ${theme === "dark" ? "rgba(201, 162, 75, 0.25)" : "rgba(140, 110, 38, 0.25)"} !important;
        }
        .custom-popup-content {
          font-family: 'Inter', sans-serif;
          padding: 6px;
        }
        .popup-title {
          font-family: 'Instrument Serif', serif;
          font-size: 16px;
          font-style: italic;
          font-weight: 600;
          margin: 0 0 2px 0;
        }
        .popup-priority {
          margin: 0;
          font-size: 10px;
          font-family: monospace;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: ${theme === "dark" ? "#A8AFA9" : "#5F6A64"};
        }
        .popup-yield {
          margin: 4px 0 0 0;
          font-size: 12px;
          color: ${theme === "dark" ? "#E8E6DF" : "#2A3530"};
        }
        /* Custom leaflet zoom control styling */
        .leaflet-bar {
          border: 1px solid ${theme === "dark" ? "rgba(232, 230, 223, 0.12)" : "rgba(42, 53, 48, 0.15)"} !important;
          box-shadow: none !important;
          border-radius: 6px !important;
          overflow: hidden;
        }
        .leaflet-bar a {
          background-color: ${theme === "dark" ? "#0F181B" : "#F7F3EA"} !important;
          color: ${theme === "dark" ? "#E8E6DF" : "#2A3530"} !important;
          border-bottom: 1px solid ${theme === "dark" ? "rgba(232, 230, 223, 0.12)" : "rgba(42, 53, 48, 0.15)"} !important;
          transition: background-color 0.2s, color 0.2s;
        }
        .leaflet-bar a:hover {
          background-color: ${theme === "dark" ? "#1B2A25" : "#EFEBE1"} !important;
          color: #C9A24B !important;
        }
        /* Custom scrollbar for region list */
        .scrollbar-custom::-webkit-scrollbar {
          width: 5px;
        }
        .scrollbar-custom::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb {
          background: ${theme === "dark" ? "rgba(232, 230, 223, 0.2)" : "rgba(42, 53, 48, 0.2)"};
          border-radius: 4px;
        }
        .scrollbar-custom::-webkit-scrollbar-thumb:hover {
          background: ${theme === "dark" ? "rgba(201, 162, 75, 0.5)" : "rgba(140, 110, 38, 0.5)"};
        }
      `}</style>
      <MapContainer
        key={key}
        center={[-0.8, 114.2]}
        zoom={6}
        minZoom={5}
        maxZoom={8}
        zoomControl={true}
        scrollWheelZoom={false}
        maxBounds={bounds}
        maxBoundsViscosity={1.0}
        style={{ height: "100%", width: "100%", zIndex: 0 }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/attributions">CARTO</a>'
          url={tileUrl}
        />
        <MapController selectedBpsCode={selectedBpsCode} dbData={activeDbData} onSelectRegion={onSelectRegion} />
        {/* Render Regencies Layer (interactive choropleth) */}
        {kabGeoData && (
          <GeoJSON
            key={theme + "-kabupaten-" + (kabGeoData ? "loaded" : "empty")}
            data={kabGeoData}
            onEachFeature={onEachRegencyFeature}
          />
        )}
        {/* Render Provinces Layer Overlay (thick outline) */}
        {provGeoData && (
          <GeoJSON
            key={theme + "-provinces-" + (provGeoData ? "loaded" : "empty")}
            data={provGeoData}
            style={provinceStyle}
          />
        )}
      </MapContainer>
    </div>
  );
});

function MapController({
  selectedBpsCode,
  dbData,
  onSelectRegion,
}: {
  selectedBpsCode: string | null;
  dbData: Map<string, {
    name: string;
    province: string;
    cluster_label: number;
    predicted_yield: number | null;
    centroid_lat?: number | null;
    centroid_lng?: number | null;
  }>;
  onSelectRegion?: (bpsCode: string | null) => void;
}) {
  const map = useMap();
  
  useEffect(() => {
    const handlePopupClose = () => {
      if (onSelectRegion) {
        onSelectRegion(null);
      }
    };
    map.on("popupclose", handlePopupClose);
    return () => {
      map.off("popupclose", handlePopupClose);
    };
  }, [map, onSelectRegion]);
  
  useEffect(() => {
    if (!selectedBpsCode) return;
    const entry = dbData.get(selectedBpsCode);
    if (entry && entry.centroid_lat && entry.centroid_lng) {
      const currentZoom = map.getZoom() || 6;
      map.setView([entry.centroid_lat, entry.centroid_lng], currentZoom, { animate: true });
      
      const priorityText = entry.cluster_label === 0 ? "Tinggi" : entry.cluster_label === 1 ? "Sedang" : "Rendah";
      const color = entry.cluster_label === 0 ? "#C9A24B" : entry.cluster_label === 1 ? "#7E8E78" : "#4B5651";
      const yieldVal = entry.predicted_yield 
        ? `${entry.predicted_yield.toFixed(2)} t/ha` 
        : "Tidak ada data";
        
      const popupContent = `
        <div class="custom-popup-content">
          <h3 class="popup-title" style="color: ${color};">${entry.name}</h3>
          <p class="popup-province" style="margin: 0; font-size: 10px; text-transform: uppercase; color: #8A958E;">${entry.province}</p>
          <div style="margin-top: 6px; border-top: 1px solid rgba(140, 110, 38, 0.15); padding-top: 6px;">
            <p class="popup-priority" style="margin: 0;">Prioritas: <strong style="color: ${color};">${priorityText}</strong></p>
            <p class="popup-yield" style="margin: 4px 0 0 0;">Estimasi Yield: <strong>${yieldVal}</strong></p>
          </div>
        </div>
      `;
      
      map.openPopup(popupContent, [entry.centroid_lat, entry.centroid_lng], {
        className: "custom-leaflet-popup",
      });
    }
  }, [selectedBpsCode, dbData, map]);

  return null;
}

function RegionRow({
  name,
  prov,
  value,
  level,
  onClick,
  isActive,
}: {
  name: string;
  prov: string;
  value: string;
  level: "high" | "med" | "low";
  onClick?: () => void;
  isActive?: boolean;
}) {
  const dotClass =
    level === "high"
      ? "bg-[#C9A24B]"
      : level === "med"
        ? "bg-[#7E8E78]"
        : "bg-[#5A6A60] dark:bg-[#8FA095]";
  return (
    <div
      onClick={onClick}
      className={`group flex items-center justify-between py-3 px-2 -mx-2 rounded-md border-b border-[#2A3530]/15 dark:border-[#E8E6DF]/12 last:border-b-0 cursor-pointer transition-colors ${
        isActive
          ? "bg-[#8C6E26]/10 dark:bg-[#C9A24B]/10 border-l-2 border-l-[#8C6E26] dark:border-l-[#C9A24B]"
          : "hover:bg-[#2A3530]/4 dark:hover:bg-[#E8E6DF]/4"
      }`}
    >
      <div className="flex items-center gap-3 min-w-0">
        <span
          className={`w-1.5 h-1.5 rounded-full shrink-0 transition-all duration-300 ${
            isActive ? "scale-150" : ""
          } ${dotClass}`}
        />
        <div className="min-w-0">
          <div
            className={`font-serif text-[15px] truncate transition-colors ${
              isActive
                ? "text-[#8C6E26] dark:text-[#C9A24B] font-semibold"
                : "text-[#2A3530] dark:text-[#E8E6DF] group-hover:text-[#8C6E26] dark:group-hover:text-[#C9A24B]"
            }`}
          >
            {name}
          </div>
          <div className="font-mono text-[10px] uppercase tracking-wider text-[#5F6A64] dark:text-[#A8AFA9] truncate">
            {prov}
          </div>
        </div>
      </div>
      <div
        className={`font-mono text-[12px] shrink-0 ml-3 transition-colors ${
          isActive
            ? "text-[#8C6E26] dark:text-[#C9A24B] font-semibold"
            : "text-[#4A5550] dark:text-[#B8BFB9] group-hover:text-[#8C6E26] dark:group-hover:text-[#C9A24B]"
        }`}
      >
        {value}
      </div>
    </div>
  );
}

export function Peta() {
  const [dbData, setDbData] = useState<Map<string, {
    name: string;
    province: string;
    cluster_label: number;
    predicted_yield: number | null;
    centroid_lat?: number | null;
    centroid_lng?: number | null;
  }>>(new Map());
  const [selectedBpsCode, setSelectedBpsCode] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    async function fetchData() {
      try {
        const [regionsRes, clustersRes, predictionsRes] = await Promise.all([
          supabase.from("regions").select("id, bps_code, name, province, centroid_lat, centroid_lng"),
          supabase.from("cluster_assignments").select("region_id, cluster_label"),
          supabase.from("predictions").select("region_id, predicted_yield").eq("target_year", 2026).eq("model_name", "lstm")
        ]);

        if (regionsRes.error) throw regionsRes.error;
        if (clustersRes.error) throw clustersRes.error;
        if (predictionsRes.error) throw predictionsRes.error;

        const regions = regionsRes.data || [];
        const clusters = clustersRes.data || [];
        const predictions = predictionsRes.data || [];

        const tempMap = new Map<string, any>();
        regions.forEach((r) => {
          tempMap.set(r.bps_code, {
            name: r.name,
            province: r.province,
            cluster_label: 2, // Default to Low
            predicted_yield: null,
            centroid_lat: r.centroid_lat ? Number(r.centroid_lat) : null,
            centroid_lng: r.centroid_lng ? Number(r.centroid_lng) : null,
          });
        });

        clusters.forEach((c) => {
          const region = regions.find((r) => r.id === c.region_id);
          if (region) {
            const entry = tempMap.get(region.bps_code);
            if (entry) entry.cluster_label = c.cluster_label;
          }
        });

        predictions.forEach((p) => {
          const region = regions.find((r) => r.id === p.region_id);
          if (region) {
            const entry = tempMap.get(region.bps_code);
            if (entry) entry.predicted_yield = Number(p.predicted_yield);
          }
        });

        setDbData(tempMap);
      } catch (err) {
        console.error("Error fetching map data from Supabase:", err);
      }
    }

    fetchData();
  }, []);

  const regionsList = useMemo(() => {
    const list: Array<{
      bps_code: string;
      name: string;
      province: string;
      cluster_label: number;
      predicted_yield: number | null;
      centroid_lat?: number | null;
      centroid_lng?: number | null;
    }> = [];
    
    dbData.forEach((val, key) => {
      list.push({
        bps_code: key,
        ...val,
      });
    });
    
    return list.sort((a, b) => {
      if (a.cluster_label !== b.cluster_label) {
        return a.cluster_label - b.cluster_label; // Tinggi (0) first, Sedang (1), Rendah (2)
      }
      return a.name.localeCompare(b.name);
    });
  }, [dbData]);

  const filteredRegions = useMemo(() => {
    if (!searchQuery.trim()) return regionsList;
    const query = searchQuery.toLowerCase();
    
    const provAbbrs: Record<string, string> = {
      "kalbar": "kalimantan barat",
      "kalteng": "kalimantan tengah",
      "kalsel": "kalimantan selatan",
      "kaltim": "kalimantan timur",
      "kaltara": "kalimantan utara"
    };

    return regionsList.filter((r) => {
      const nameMatch = r.name.toLowerCase().includes(query);
      const provMatch = r.province.toLowerCase().includes(query);
      
      const abbrMatch = Object.entries(provAbbrs).some(([abbr, fullName]) => {
        return query.includes(abbr) && r.province.toLowerCase().includes(fullName);
      });
      
      return nameMatch || provMatch || abbrMatch;
    });
  }, [regionsList, searchQuery]);

  const displayedRegions = useMemo(() => {
    if (searchQuery.trim() !== "") {
      return filteredRegions;
    }
    const defaultCodes = ["6403", "6202", "6107", "6310"];
    return regionsList.filter((r) => defaultCodes.includes(r.bps_code));
  }, [regionsList, filteredRegions, searchQuery]);

  const counts = useMemo(() => {
    let high = 0;
    let med = 0;
    let low = 0;
    dbData.forEach((val) => {
      if (val.cluster_label === 0) high++;
      else if (val.cluster_label === 1) med++;
      else if (val.cluster_label === 2) low++;
    });
    return {
      high: high || 19,
      med: med || 19,
      low: low || 18,
    };
  }, [dbData]);

  return (
    <section
      id="peta"
      className="relative px-5 sm:px-8 lg:px-14 py-20 sm:py-28 border-t border-[#2A3530]/15 dark:border-[#E8E6DF]/12"
    >
      <div className="grid lg:grid-cols-12 gap-8 lg:gap-10 mb-12 sm:mb-16">
        <div className="lg:col-span-5">
          <div className="flex items-center gap-3 mb-8 sm:mb-12">
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#8C6E26] dark:text-[#C9A24B]">
              03
            </span>
            <span className="h-px w-10 bg-[#C9A24B]/40" />
            <span className="font-mono text-[11px] tracking-[0.2em] uppercase text-[#5F6A64] dark:text-[#A8AFA9]">
              Peta · Pratinjau
            </span>
          </div>
          <Reveal>
            <h2 className="font-serif text-[32px] sm:text-[40px] lg:text-[52px] leading-[1.05] tracking-[-0.02em] text-[#2A3530] dark:text-[#E8E6DF]">
              Lanskap prioritas{" "}
              <em className="italic text-[#8C6E26] dark:text-[#C9A24B]">
                Kalimantan
              </em>
              , dalam satu pandangan.
            </h2>
          </Reveal>
        </div>
        <div className="lg:col-span-5 lg:col-start-8 flex items-end">
          <p className="text-[14px] sm:text-[15px] leading-[1.7] text-[#4A5550] dark:text-[#B8BFB9]">
            Cuplikan ringkas distribusi 56 kabupaten berdasarkan indeks
            produktivitas dan tingkat risiko di lima provinsi Kalimantan.
          </p>
        </div>
      </div>

      <div className="grid lg:grid-cols-12 gap-px bg-[#2A3530]/12 dark:bg-[#E8E6DF]/12 rounded-2xl overflow-hidden items-stretch">
        <div className="lg:col-span-7 relative bg-[#F7F3EA] dark:bg-[#0F181B] p-5 sm:p-7 lg:p-9 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4 sm:mb-5">
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-[#C9A24B]" />
              <span className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#5F6A64] dark:text-[#A8AFA9]">
                Live Preview
              </span>
            </div>
            <span className="font-mono text-[10px] tracking-wider uppercase text-[#5F6A64] dark:text-[#A8AFA9]">
              56 Wilayah · 5 Provinsi
            </span>
          </div>

          <div className="relative flex-1">
            <KalimantanMap
              dbData={dbData}
              selectedBpsCode={selectedBpsCode}
              onSelectRegion={setSelectedBpsCode}
            />
          </div>
        </div>

        <aside className="lg:col-span-5 bg-[#F7F3EA] dark:bg-[#0F181B] p-6 sm:p-7 lg:p-9 flex flex-col justify-between max-h-[560px] overflow-hidden gap-4">
          <div>
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#5F6A64] dark:text-[#A8AFA9] mb-3">
              Distribusi Prioritas (K-Means)
            </div>
            <div className="flex items-baseline gap-6">
              {[
                { dot: "bg-[#C9A24B]", l: "Tinggi", n: counts.high },
                { dot: "bg-[#7E8E78]", l: "Sedang", n: counts.med },
                { dot: "bg-[#5A6A60] dark:bg-[#8FA095]", l: "Rendah", n: counts.low },
              ].map((i) => (
                <div key={i.l} className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${i.dot}`} />
                    <span className="text-[11px] text-[#5F6A64] dark:text-[#A8AFA9]">
                      {i.l}
                    </span>
                  </div>
                  <span className="font-serif text-[24px] sm:text-[28px] leading-none text-[#2A3530] dark:text-[#E8E6DF]">
                    {i.n}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-[#2A3530]/12 dark:bg-[#E8E6DF]/12" />

          <div className="flex-1 flex flex-col min-h-0">
            <div className="font-mono text-[10px] tracking-[0.2em] uppercase text-[#5F6A64] dark:text-[#A8AFA9] mb-3">
              Sorotan Wilayah (LSTM 2026)
            </div>
            
            {/* Search Bar */}
            <div className="relative mb-3">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5F6A64] dark:text-[#A8AFA9]">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </span>
              <input
                type="text"
                placeholder="Cari kabupaten atau provinsi..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-[#2A3530]/15 dark:border-[#E8E6DF]/12 bg-[#F7F3EA] dark:bg-[#0F181B] text-[#2A3530] dark:text-[#E8E6DF] placeholder-[#5F6A64]/50 dark:placeholder-[#A8AFA9]/50 text-[13px] focus:outline-none focus:border-[#8C6E26] dark:focus:border-[#C9A24B] transition-colors"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#5F6A64] dark:text-[#A8AFA9] hover:text-[#8C6E26] dark:hover:text-[#C9A24B] transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>

            {/* Scrollable list */}
            <div data-lenis-prevent className="flex-1 overflow-y-auto overflow-x-hidden pr-1 scrollbar-custom min-h-0">
              {displayedRegions.length > 0 ? (
                displayedRegions.map((region) => {
                  const yieldText = region.predicted_yield 
                    ? `${region.predicted_yield.toFixed(1)} t/ha` 
                    : "Tidak ada data";
                  const levelMap: Record<number, "high" | "med" | "low"> = {
                    0: "high",
                    1: "med",
                    2: "low"
                  };
                  return (
                    <RegionRow
                      key={region.bps_code}
                      name={region.name.replace(/^(Kabupaten|Kota)\s+/i, "")}
                      prov={region.province.replace("Kalimantan ", "Kal")}
                      value={yieldText}
                      level={levelMap[region.cluster_label] || "low"}
                      onClick={() => setSelectedBpsCode(region.bps_code)}
                      isActive={selectedBpsCode === region.bps_code}
                    />
                  );
                })
              ) : (
                <div className="py-6 text-center font-mono text-[11px] text-[#5F6A64] dark:text-[#A8AFA9]">
                  Tidak ada wilayah yang cocok
                </div>
              )}
            </div>
          </div>

          <div className="h-px bg-[#2A3530]/12 dark:bg-[#E8E6DF]/12" />

          {/* Premium Locked AI Chatbot Teaser */}
          <div className="p-3 rounded-lg bg-[#EFEBE1]/80 dark:bg-[#12201C]/20 border border-[#8C6E26]/15 dark:border-[#C9A24B]/15 flex items-start sm:items-center justify-between gap-3 text-[12px] relative overflow-hidden group shrink-0">
            <div className="flex items-start gap-2 text-[#5F6A64] dark:text-[#A8AFA9] min-w-0 z-10">
              <svg className="w-4 h-4 text-[#8C6E26] dark:text-[#C9A24B] shrink-0 mt-0.5 sm:mt-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="break-words">
                Bandingkan yield Banjar vs Tabalong 2024 via <strong className="text-[#8C6E26] dark:text-[#C9A24B]">Asisten AI</strong>
              </span>
            </div>
            <Link
              to="/masuk"
              className="px-2.5 py-1 text-[11px] font-mono uppercase tracking-wider rounded bg-[#8C6E26] dark:bg-[#C9A24B] text-[#F7F3EA] dark:text-[#0F181B] font-semibold hover:bg-[#70581E] dark:hover:bg-[#D9B25B] transition-colors shrink-0 z-10 mt-0.5 sm:mt-0"
            >
              Masuk
            </Link>
          </div>
        </aside>
      </div>
    </section>
  );
}
