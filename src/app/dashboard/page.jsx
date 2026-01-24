"use client";

import { useState, useEffect } from "react";
import { FaCalendarAlt, FaFolder, FaImage, FaExternalLinkAlt } from "react-icons/fa";
import Link from "next/link";

export default function DashboardPage() {
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [groups, setGroups] = useState([]);

  // โหลด events
  useEffect(() => {
    fetch("/api/events")
      .then((res) => res.json())
      .then((data) => {
        setEvents(data);
        if (data.length > 0) setSelectedEvent(data[0]);
      })
      .catch(console.error);
  }, []);

  // โหลด groups ของ event ที่เลือก
  useEffect(() => {
    if (!selectedEvent?._id) return;

    fetch(`/api/events/${selectedEvent._id}/groups`)
      .then((res) => res.json())
      .then((data) => setGroups(data))
      .catch(console.error);
  }, [selectedEvent]);

  const stats = [
    {
      title: "Event",
      value: events.length,
      icon: <FaCalendarAlt />,
      bg: "bg-[#FFDD56]",
    },
    {
      title: "Groups",
      value: groups.length,
      icon: <FaFolder />,
      bg: "bg-[#22C55E]",
    },
    {
      title: "Total Images",
      value: groups.reduce((sum, g) => sum + (g.imageCount || 0), 0),
      icon: <FaImage />,
      bg: "bg-[#A345F7]",
    },
  ];

  return (
    <div className="w-full p-6 animate-fade-in ">
      <h1 className="text-2xl font-semibold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {stats.map((item, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-4 p-4 rounded-lg shadow text-white ${item.bg}
            transition-all duration-300
            hover:-translate-y-1 hover:shadow-lg`}
          >
            <div className="p-3 bg-white text-black rounded-lg shadow">
              {item.icon}
            </div>
            <div className="text-black">
              <p className="text-lg font-medium">{item.title}</p>
              <p className="text-2xl font-bold">{item.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mb-6 flex gap-3">
        {events.map((event) => (
          <button
            key={event._id}
            onClick={() => setSelectedEvent(event)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200
                hover:-translate-y-0.5 hover:shadow 
                ${selectedEvent?._id === event._id
                ? "bg-blue-600 text-white"
                : "bg-gray-200 hover:bg-gray-300"
              }`}
          >
            {event.name}
          </button>
        ))}
      </div>

      {selectedEvent && (
        <>
          <h2 className="text-lg font-semibold mb-4">{selectedEvent.name}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {groups.map((group) => (
              <div
                key={group._id}
                className="bg-blue-50 rounded-xl p-6 shadow-sm transition"
              >
                <div className="flex justify-between mb-3">
                  <h3 className="font-semibold">{group.name}</h3>
                  <span className="text-sm text-gray-500">
                    {group.imageCount} images
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-500">Link URL :</span>
                  <div className="flex-1 truncate text-sm text-blue-600">
                    {group.link}
                  </div>
                  <Link
                    href={`/dashboard/${selectedEvent.slug}/${group.slug}/display`}
                    
                    className="flex items-center gap-1 bg-blue-500 text-white text-sm px-3 py-1 rounded-full hover:scale-105"
                  >
                    <FaExternalLinkAlt /> Open
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}