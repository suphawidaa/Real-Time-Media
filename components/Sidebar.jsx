"use client";

import { useState, useEffect, useRef } from "react";
import { useSession, signOut } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";
import {
  FiGrid,
  FiCalendar,
  FiFolder,
  FiChevronUp,
  FiChevronDown,
  FiLogOut,
  FiPlus,
  FiMoreVertical,
} from "react-icons/fi";
import { FaUserAlt } from "react-icons/fa";

const slugify = (text) =>
  text.toLowerCase().trim().replace(/\s+/g, "-");

export default function Sidebar({ children }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  const isDashboard = pathname === "/dashboard";

  const [events, setEvents] = useState([]);
  const [groups, setGroups] = useState([]);

  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);

  const [openEvents, setOpenEvents] = useState(true);
  const [openGroups, setOpenGroups] = useState(true);

  const [addingEvent, setAddingEvent] = useState(false);
  const [addingGroup, setAddingGroup] = useState(false);

  const addEventRef = useRef(null);
  const addGroupRef = useRef(null);

  const [newEventName, setNewEventName] = useState("");
  const [newGroupName, setNewGroupName] = useState("");

  const [openMenu, setOpenMenu] = useState(null);
  const [renaming, setRenaming] = useState(null);
  const [renameText, setRenameText] = useState("");

  const [openGroupMenu, setOpenGroupMenu] = useState(null);
  const [renamingGroup, setRenamingGroup] = useState(null);
  const [renameGroupText, setRenameGroupText] = useState("");

  const menuRef = useRef(null);
  const groupMenuRef = useRef(null);

  /* FETCH EVENTS */
  useEffect(() => {
    fetch("/api/events")
      .then((res) => {
        if (!res.ok) throw new Error("Load events failed");
        return res.json();
      })
      .then(setEvents)
      .catch(console.error);
  }, []);

  /* FETCH GROUPS */
  const loadGroups = async (eventId) => {
    try {
      const res = await fetch(`/api/events/${eventId}/groups`);
      if (!res.ok) throw new Error("Load groups failed");
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      console.error(err);
      setGroups([]);
    }
  };

  /* SYNC EVENT & GROUP FROM URL */
  useEffect(() => {
    if (!events.length) return;
    const parts = pathname.split("/");
    const eventSlug = parts[2];
    const groupSlug = parts[3];

    const foundEvent = events.find((ev) => ev.slug === eventSlug);
    if (foundEvent) {
      setSelectedEvent(foundEvent);
      loadGroups(foundEvent._id);
      
      if (groupSlug) {
      }
    } else if (isDashboard) {
      setSelectedEvent(null);
      setGroups([]);
    }
  }, [events, pathname, isDashboard]);

  useEffect(() => {
    if (!groups.length) return;
    const parts = pathname.split("/");
    const groupSlug = parts[3];
    const foundGroup = groups.find((g) => g.slug === groupSlug);
    if (foundGroup) setSelectedGroup(foundGroup);
  }, [groups, pathname]);

  /* CLICK OUTSIDE HANDLERS */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (addingEvent && addEventRef.current && !addEventRef.current.contains(e.target)) {
        setAddingEvent(false);
        setNewEventName("");
      }
      if (addingGroup && addGroupRef.current && !addGroupRef.current.contains(e.target)) {
        setAddingGroup(false);
        setNewGroupName("");
      }
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
        setRenaming(null);
      }
      if (groupMenuRef.current && !groupMenuRef.current.contains(e.target)) {
        setOpenGroupMenu(null);
        setRenamingGroup(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [addingEvent, addingGroup]);

  if (status === "loading") return null;

  const menuBase = "group relative flex items-center gap-3 px-4 py-2 cursor-pointer rounded-md transition";
  const activeStyle = "bg-[#2C3B41] text-white";
  const hoverStyle = "hover:bg-[#2C3B41]";
  const indicator = "absolute left-0 top-0 h-full w-1 bg-blue-400 rounded-r";

  return (
    <div className="grid grid-cols-[18rem_1fr] min-h-screen">
      <aside className="bg-[#1E282C] text-gray-300 flex flex-col justify-between overflow-y-auto">
        <div>
          <h1 className="text-center text-white font-bold text-xl py-5">
            RT <span className="font-light">Admin</span>
          </h1>

          <div
            onClick={() => {
              router.push("/dashboard");
              setSelectedEvent(null);
              setGroups([]);
            }}
            className={`${menuBase} ${isDashboard ? activeStyle : hoverStyle}`}
          >
            <span className={`${indicator} ${isDashboard ? "opacity-100" : "opacity-0"}`} />
            <FiGrid /> Dashboard
          </div>

          {/* EVENTS SECTION */}
          <div className="mt-4">
            <div
              onClick={() => setOpenEvents(!openEvents)}
              className={`${menuBase} ${hoverStyle} justify-between`}
            >
              <div className="flex items-center gap-3">
                <FiCalendar />
                <span>Events</span>
              </div>
              <div className="flex gap-2">
                <FiPlus
                  className="hover:text-white"
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddingEvent(true);
                    setOpenEvents(true);
                  }}
                />
                {openEvents ? <FiChevronUp /> : <FiChevronDown />}
              </div>
            </div>

            {openEvents && (
              <div className="mt-1">
                {addingEvent && (
                  <div className="px-4 mb-2">
                    <input
                      ref={addEventRef}
                      autoFocus
                      placeholder="Event name..."
                      value={newEventName}
                      onChange={(e) => setNewEventName(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && newEventName.trim()) {
                          const res = await fetch("/api/events", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ name: newEventName, slug: slugify(newEventName) }),
                          });
                          if (res.ok) {
                            const data = await res.json();
                            setEvents((prev) => [...prev, data]);
                            setAddingEvent(false);
                            setNewEventName("");
                          }
                        }
                      }}
                      className="w-full bg-[#2C3B41] px-3 py-2 rounded text-sm outline-none border border-blue-500"
                    />
                  </div>
                )}

                {events.map((event) => {
                  const isEventActive = selectedEvent?._id === event._id;
                  return (
                    <div key={event._id} className="flex flex-col">
                      {/* EVENT ITEM */}
                      <div
                        className={`${menuBase} mx-2 ${isEventActive ? activeStyle : hoverStyle}`}
                        onClick={() => {
                          setSelectedEvent(event);
                          loadGroups(event._id);
                          setOpenGroups(true);
                        }}
                      >
                        <span className={`${indicator} ${isEventActive ? "opacity-100" : "opacity-0"}`} />
                        
                        {renaming === event._id ? (
                          <input
                            autoFocus
                            value={renameText}
                            onChange={(e) => setRenameText(e.target.value)}
                            onClick={(e) => e.stopPropagation()}
                            onKeyDown={async (e) => {
                              if (e.key === "Enter") {
                                await fetch(`/api/events/${event._id}`, {
                                  method: "PATCH",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ name: renameText, slug: slugify(renameText) }),
                                });
                                setEvents(prev => prev.map(ev => ev._id === event._id ? {...ev, name: renameText} : ev));
                                setRenaming(null);
                              }
                            }}
                            className="bg-transparent border-b border-blue-400 outline-none flex-1"
                          />
                        ) : (
                          <span className="flex-1 truncate">{event.name}</span>
                        )}

                        <FiMoreVertical
                          className="opacity-0 group-hover:opacity-100 transition"
                          onClick={(e) => {
                            e.stopPropagation();
                            setOpenMenu(event._id);
                          }}
                        />

                        {openMenu === event._id && (
                          <div ref={menuRef} className="absolute right-2 top-10 bg-[#2C3B41] rounded shadow-xl z-50 py-1 text-sm border border-gray-600">
                            <div className="px-4 py-2 hover:bg-black/30" onClick={(e) => { e.stopPropagation(); setRenaming(event._id); setRenameText(event.name); setOpenMenu(null); }}>Rename</div>
                            <div className="px-4 py-2 text-red-400 hover:bg-black/30" onClick={async (e) => {
                              e.stopPropagation();
                              await fetch(`/api/events/${event._id}`, { method: "DELETE" });
                              setEvents(prev => prev.filter(ev => ev._id !== event._id));
                              if (isEventActive) { setSelectedEvent(null); setGroups([]); router.push("/dashboard"); }
                            }}>Delete</div>
                          </div>
                        )}
                      </div>

                      {/* NESTED GROUPS LIST */}
                      {isEventActive && (
                        <div className="ml-9 mt-1 mb-2 space-y-1 border-l border-gray-700">
                          {groups.map((group) => {
                            const isGroupActive = selectedGroup?._id === group._id;
                            return (
                              <div
                                key={group._id}
                                className={`group relative flex items-center gap-2 px-3 py-1.5 cursor-pointer rounded-r-md transition text-sm ${
                                  isGroupActive ? "text-blue-400 bg-blue-400/5" : "hover:bg-[#2C3B41] text-gray-400"
                                }`}
                                onClick={() => {
                                  setSelectedGroup(group);
                                  router.push(`/dashboard/${event.slug}/${group.slug}`);
                                }}
                              >
                                <FiFolder size={14} />
                                {renamingGroup === group._id ? (
                                  <input
                                    autoFocus
                                    value={renameGroupText}
                                    onChange={(e) => setRenameGroupText(e.target.value)}
                                    onClick={(e) => e.stopPropagation()}
                                    onKeyDown={async (e) => {
                                      if (e.key === "Enter") {
                                        await fetch(`/api/events/${event._id}/groups/${group._id}`, {
                                          method: "PATCH",
                                          headers: { "Content-Type": "application/json" },
                                          body: JSON.stringify({ name: renameGroupText, slug: slugify(renameGroupText) }),
                                        });
                                        setGroups(prev => prev.map(g => g._id === group._id ? {...g, name: renameGroupText} : g));
                                        setRenamingGroup(null);
                                      }
                                    }}
                                    className="bg-transparent border-b border-blue-400 outline-none flex-1 text-white"
                                  />
                                ) : (
                                  <span className="flex-1 truncate font-medium">{group.name}</span>
                                )}
                                
                                <FiMoreVertical
                                  className="opacity-0 group-hover:opacity-100"
                                  onClick={(e) => { e.stopPropagation(); setOpenGroupMenu(group._id); }}
                                />

                                {openGroupMenu === group._id && (
                                  <div ref={groupMenuRef} className="absolute right-0 top-8 bg-[#2C3B41] rounded shadow-xl z-50 py-1 border border-gray-600">
                                    <div className="px-4 py-2 hover:bg-black/30 text-white" onClick={(e) => { e.stopPropagation(); setRenamingGroup(group._id); setRenameGroupText(group.name); setOpenGroupMenu(null); }}>Rename</div>
                                    <div className="px-4 py-2 text-red-400 hover:bg-black/30" onClick={async (e) => {
                                      e.stopPropagation();
                                      await fetch(`/api/events/${event._id}/groups/${group._id}`, { method: "DELETE" });
                                      setGroups(prev => prev.filter(g => g._id !== group._id));
                                      setOpenGroupMenu(null);
                                    }}>Delete</div>
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* ADD GROUP BUTTON */}
                          {addingGroup ? (
                            <div className="px-2">
                              <input
                                ref={addGroupRef}
                                autoFocus
                                placeholder="Group name..."
                                value={newGroupName}
                                onChange={(e) => setNewGroupName(e.target.value)}
                                onKeyDown={async (e) => {
                                  if (e.key === "Enter" && newGroupName.trim()) {
                                    const res = await fetch(`/api/events/${event._id}/groups`, {
                                      method: "POST",
                                      headers: { "Content-Type": "application/json" },
                                      body: JSON.stringify({ name: newGroupName, slug: slugify(newGroupName) }),
                                    });
                                    if (res.ok) {
                                      const data = await res.json();
                                      setGroups(prev => [...prev, data]);
                                      setAddingGroup(false);
                                      setNewGroupName("");
                                    }
                                  }
                                }}
                                className="w-full bg-[#2C3B41] px-2 py-1 rounded text-[15px] outline-none border border-blue-500 text-white"
                              />
                            </div>
                          ) : (
                            <div 
                              onClick={() => setAddingGroup(true)}
                              className="flex items-center gap-2 px-3 py-1 text-[15px] text-gray-500 hover:text-blue-400 cursor-pointer transition"
                            >
                              <FiPlus size={14} /> Add Group
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="m-4 flex items-center justify-center gap-2 bg-[#005BA9] hover:bg-[#004a8a] text-white rounded-lg py-2 transition"
        >
          <FiLogOut /> Log out
        </button>
      </aside>

      <main className="flex flex-col h-screen overflow-hidden">
        <header className="h-16 bg-[#005BA9] flex justify-end px-6 items-center flex-shrink-0 shadow-md">
          <div className="flex items-center gap-3 text-white">
            <div className="w-9 h-9 rounded-full bg-gray-400 flex items-center justify-center border-2 border-white/20">
              <FaUserAlt />
            </div>
            <span className="font-medium">{session?.user?.username || "Admin"}</span>
          </div>
        </header>

        <section className="p-6 flex-1 overflow-auto bg-gray-50 text-gray-800">
          {children}
        </section>
      </main>
    </div>
  );
}