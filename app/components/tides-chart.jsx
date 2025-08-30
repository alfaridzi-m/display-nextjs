'use client'

import { useState, useEffect, useMemo, useRef } from "react";
import * as d3 from "d3";
import { lightTheme, darkTheme } from "./theme";


const TidesCard = ({ code, height = 360, className = "", dataOverride, theme }) => {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("idle");
  const containerRef = useRef(null);
  const svgRef = useRef(null);
  const [tz, setTz] = useState("WIB"); // WIB (UTC+7) atau UTC

  useEffect(() => { 
    let ignore = false;
    async function load() {
      try {
        setStatus("loading");
        if (dataOverride) {
          if (!ignore) {
            setData(dataOverride);
            setStatus("success");
          }
          return;
        }
        const url = `https://maritim.bmkg.go.id/marine-data/pelabuhan/${code}.json`;
        console.log(url);
        const res = await fetch(url);
        if (!res.ok) throw new Error(`Gagal fetch: ${res.status}`);
        const json = await res.json();
        if (!ignore) {
          setData(json);
          setStatus("success");
        }
      } catch (err) {
        console.error(err);
        if (!ignore) setStatus("error");
      }
    }
    load();
    return () => {
      ignore = true;
    };
  }, [code, dataOverride]);

  const points = useMemo(() => {
    if (!data) return [];
    const a = Array.isArray(data?.forecast_day1) ? data.forecast_day1 : [];
    const b = Array.isArray(data?.["forecast_day2-4"]) ? data["forecast_day2-4"] : [];
    const raw = [...a, ...b];
    return raw
      .filter((d) => d && typeof d.tides === "number" && d.time)
      .map((d) => ({
        dateUTC: new Date(d.time),
        tide: d.tides,
      }))
      .sort((p, q) => p.dateUTC - q.dateUTC);
  }, [data]);

  const timeToLabel = (date) => {
    if (tz === "UTC") return d3.timeFormat("%d %b %H:%M UTC")(date);
    const wib = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return d3.timeFormat("%d %b %H:%M WIB")(wib);
  };

  const [width, setWidth] = useState(800);
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setWidth(el.clientWidth);
    });
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    const svgEl = svgRef.current;
    if (!svgEl) return;

    const svg = d3.select(svgEl);
    svg.selectAll("*").remove();

    const margin = { top: 8, right: 8, bottom: 48, left: 48 };
    const innerW = Math.max(0, width - margin.left - margin.right);
    const innerH = Math.max(0, height - margin.top - margin.bottom);

    const g = svg
      .attr("viewBox", `0 0 ${width} ${height}`)
      .append("g")
      .attr("transform", `translate(${margin.left},${margin.top})`);

    if (!points.length) {
      g
        .append("text")
        .attr("x", innerW / 2)
        .attr("y", innerH / 2)
        .attr("text-anchor", "middle")
        .attr("class", `fill-current ${theme.text.secondary}`)
        .text(status === "loading" ? "Memuat data…" : status === "error" ? "Gagal memuat data" : "Tidak ada data");
      return;
    }

    const x = d3.scaleUtc().domain(d3.extent(points, (d) => d.dateUTC)).range([0, innerW]);
    const [minT, maxT] = d3.extent(points, (d) => d.tide);
    const pad = Math.max(0.1, (maxT - minT) * 0.1);
    const y = d3.scaleLinear().domain([minT - pad, maxT + pad]).nice().range([innerH, 0]);

    const xAxis = d3.axisBottom(x).ticks(Math.min(12, Math.ceil(innerW / 80)));
    const yAxis = d3.axisLeft(y).ticks(Math.min(8, Math.ceil(innerH / 50)));

    const line = d3.line().x((d) => x(d.dateUTC)).y((d) => y(d.tide)).curve(d3.curveMonotoneX);
    const area = d3.area().x((d) => x(d.dateUTC)).y0(() => y(d3.min(points, (p) => p.tide) - pad)).y1((d) => y(d.tide)).curve(d3.curveMonotoneX);

    g.append("g").attr("class", `stroke-current ${theme.text.secondary} opacity-50`).attr("transform", `translate(0,${innerH})`).call(xAxis).call((gAxis) => gAxis.selectAll("text").attr("class", `fill-current ${theme.text.secondary}`).attr("font-size", 12)).call((gAxis) => gAxis.selectAll(".domain").attr("opacity", 0.2)).call((gAxis) => gAxis.selectAll(".tick line").attr("opacity", 0.1));
    g.append("g").attr("class", `stroke-current ${theme.text.secondary} opacity-50`).call(yAxis).call((gAxis) => gAxis.selectAll("text").attr("class", `fill-current ${theme.text.secondary}`).attr("font-size", 12)).call((gAxis) => gAxis.selectAll(".domain").attr("opacity", 0.2)).call((gAxis) => gAxis.selectAll(".tick line").attr("x2", innerW).attr("opacity", 0.06));

    g.append("text")
        .attr("transform", `rotate(-90)`)
        .attr("x", -(height / 2.5)) 
        .attr("y", -margin.left + 12)
        .attr("class", `fill-current ${theme.text.primary} text-md font-bold`)
        .attr("text-anchor", "middle")
        .text("Meter");
    g.append("text").attr("x", innerW).attr("y", innerH + 36).attr("text-anchor", "end").attr("class", `fill-current ${theme.text.secondary} text-xs`).text("Waktu");

    g.append("path").datum(points).attr("fill", "rgba(128, 128, 128, 0.2)").attr("stroke", "none").attr("d", area);
    g.append("path").datum(points).attr("fill", "none").attr("stroke", "#666666").attr("stroke-width", 1).attr("d", line);

    const tooltip = d3.select(containerRef.current).append("div").attr("class", `absolute pointer-events-none backdrop-blur px-3 py-2 rounded-xl shadow-lg border ${theme.border} ${theme.text.primary}`).style("opacity", 0).style("background-color", theme === lightTheme ? 'rgba(255, 255, 255, 0.8)' : 'rgba(31, 41, 55, 0.8)');
    const focusDot = g.append("circle").attr("r", 3.5).attr("fill", "#1d4ed8").attr("stroke", "white").attr("stroke-width", 1.5).style("opacity", 0);
    const bisect = d3.bisector((d) => d.dateUTC).center;

    function onMove(event) {
      const [mx] = d3.pointer(event);
      const xDate = x.invert(mx);
      const idx = bisect(points, xDate);
      const p = points[Math.max(0, Math.min(points.length - 1, idx))];
      focusDot.attr("cx", x(p.dateUTC)).attr("cy", y(p.tide)).style("opacity", 1);
      const containerRect = containerRef.current.getBoundingClientRect();
      const svgRect = svgEl.getBoundingClientRect();
      const cx = svgRect.left + margin.left + x(p.dateUTC) - containerRect.left;
      const cy = svgRect.top + margin.top + y(p.tide) - containerRect.top;
      tooltip.style("left", `${cx + 12}px`).style("top", `${cy - 12}px`).style("opacity", 1).html(`<div class="font-medium">${timeToLabel(p.dateUTC)}</div><div class="${theme.text.secondary}">Tide: <span class="font-semibold ${theme.text.primary}">${p.tide.toFixed(2)} m</span></div>`);
    }

    function onLeave() {
      focusDot.style("opacity", 0);
      tooltip.style("opacity", 0);
    }

    g.append("rect").attr("width", innerW).attr("height", innerH).attr("fill", "transparent").on("mousemove", onMove).on("mouseleave", onLeave).on("touchmove", (e) => { e.preventDefault(); onMove(e); });

    return () => {
      tooltip.remove();
    };
  }, [points, width, height, tz, status, theme]);

  return (
    <div className={`w-full h-full flex flex-col ${className}`}>
        <div className="flex items-center justify-between gap-3 mb-2 px-2">
            <div>
                <h2 className={`text-2xl font-bold ${theme.text.primary}`}>Grafik Pasang Surut</h2>
            </div>
        </div>
        <div ref={containerRef} className="relative w-full">
            <svg ref={svgRef} className="w-full h-full block select-none" />
        </div>
    </div>
  );
}
export default TidesCard

