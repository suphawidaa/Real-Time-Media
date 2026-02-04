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

  /* SYNC EVENT FROM URL */
  useEffect(() => {
    if (!events.length) return;

    const parts = pathname.split("/");
    const eventSlug = parts[2];

    if (!eventSlug) return;

    const foundEvent = events.find(
      (ev) => ev.slug === eventSlug
    );

    if (foundEvent) {
      setSelectedEvent(foundEvent);
      loadGroups(foundEvent._id);
      setOpenGroups(true);
    }
  }, [events, pathname]);

  /* SYNC GROUP FROM URL */
  useEffect(() => {
    if (!groups.length) return;

    const parts = pathname.split("/");
    const groupSlug = parts[3];

    if (!groupSlug) return;

    const foundGroup = groups.find(
      (g) => g.slug === groupSlug
    );

    if (foundGroup) {
      setSelectedGroup(foundGroup);
    }
  }, [groups, pathname]);

  /* CLICK OUTSIDE ADD EVENT / GROUP */
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        addingEvent &&
        addEventRef.current &&
        !addEventRef.current.contains(e.target)
      ) {
        setAddingEvent(false);
        setNewEventName("");
      }

      if (
        addingGroup &&
        addGroupRef.current &&
        !addGroupRef.current.contains(e.target)
      ) {
        setAddingGroup(false);
        setNewGroupName("");
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [addingEvent, addingGroup]);

  /* CLICK OUTSIDE */
  useEffect(() => {
    const handler = (e) => {
      // EVENT
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpenMenu(null);
        setRenaming(null);
      }

      // GROUP
      if (groupMenuRef.current && !groupMenuRef.current.contains(e.target)) {
        setOpenGroupMenu(null);
        setRenamingGroup(null);
      }
    };

    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  if (status === "loading") return null;

  const menuBase =
    "group relative flex items-center gap-3 px-4 py-2 cursor-pointer rounded-md transition";
  const activeStyle = "bg-[#2C3B41] text-white";
  const hoverStyle = "hover:bg-[#2C3B41]";
  const indicator =
    "absolute left-0 top-0 h-full w-1 bg-blue-400 rounded-r";

  return (
    <div className="grid grid-cols-[18rem_1fr] min-h-screen">
      <aside className="bg-[#1E282C] text-gray-300 flex flex-col justify-between">
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
            className={`${menuBase} ${isDashboard ? activeStyle : hoverStyle
              }`}
          >
            <span
              className={`${indicator} ${isDashboard ? "opacity-100" : "opacity-0"
                }`}
            />
            <FiGrid /> Dashboard
          </div>

          {/* EVENTS */}
          <div className="mt-4">
            <div
              onClick={() => setOpenEvents(!openEvents)}
              className={`${menuBase} ${hoverStyle}`}
            >
              <FiCalendar />
              <span className="flex-1">Events</span>

              <div className="flex gap-2">
                {openEvents ? <FiChevronUp /> : <FiChevronDown />}
                <FiPlus
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddingEvent(true);
                  }}
                />
              </div>
            </div>

            {openEvents && (
              <div className="ml-4 mt-1 space-y-1">
                {addingEvent && (
                  <input
                    ref={addEventRef}
                    autoFocus
                    value={newEventName}
                    onChange={(e) => setNewEventName(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && newEventName.trim()) {
                        const res = await fetch("/api/events", {
                          method: "POST",
                          headers: {
                            "Content-Type": "application/json",
                          },
                          body: JSON.stringify({
                            name: newEventName,
                            slug: slugify(newEventName),
                          }),
                        });

                        if (!res.ok) return;

                        const data = await res.json();
                        setEvents((prev) => [...prev, data]);
                        setAddingEvent(false);
                        setNewEventName("");
                      }

                      if (e.key === "Escape") {
                        setAddingEvent(false);
                        setNewEventName("");
                      }
                    }}
                    className="w-[95%] bg-[#2C3B41] px-3 py-2 mt-2 mb-2 rounded"
                  />
                )}


                {/* EVENT LIST */}
                {events.map((event) => (
                  <div
                    key={event._id}
                    className={`${menuBase} ${selectedEvent?._id === event._id
                      ? activeStyle
                      : hoverStyle
                      }`}
                    onClick={() => {
                      setSelectedEvent(event);
                      setGroups([]);
                      loadGroups(event._id);
                      setOpenGroups(true);
                      setSelectedGroup(null);
                    }}
                  >
                    <span
                      className={`${indicator} ${selectedEvent?._id === event._id
                        ? "opacity-100"
                        : "opacity-0"
                        }`}
                    />

                    {renaming === event._id ? (
                      <input
                        autoFocus
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        onKeyDown={async (e) => {
                          if (e.key === "Enter") {
                            await fetch(`/api/events/${event._id}`, {
                              method: "PATCH",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                name: renameText,
                                slug: slugify(renameText),
                              }),
                            });

                            setEvents((prev) =>
                              prev.map((ev) =>
                                ev._id === event._id
                                  ? { ...ev, name: renameText }
                                  : ev
                              )
                            );
                            setRenaming(null);
                          }
                        }}
                        className="bg-transparent border-b outline-none flex-1"
                      />
                    ) : (
                      <span className="flex-1">{event.name}</span>
                    )}

                    <FiMoreVertical
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenu(event._id);
                      }}
                    />

                    {openMenu === event._id && (
                      <div
                        ref={menuRef}
                        className="absolute right-2 top-10 bg-[#2C3B41] rounded shadow z-50"
                      >
                        <div
                          className="px-4 py-2 hover:bg-black/30"
                          onClick={() => {
                            setRenaming(event._id);
                            setRenameText(event.name);
                            setOpenMenu(null);
                          }}
                        >
                          Rename
                        </div>
                        <div
                          className="px-4 py-2 text-red-400 hover:bg-black/30"
                          onClick={async () => {
                            await fetch(
                              `/api/events/${event._id}`,
                              { method: "DELETE" }
                            );
                            setEvents((prev) =>
                              prev.filter(
                                (ev) => ev._id !== event._id
                              )
                            );
                            setSelectedEvent(null);
                            setGroups([]);
                          }}
                        >
                          Delete
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* GROUPS */}
          {selectedEvent && (
            <div className="mt-4">
              <div
                onClick={() => setOpenGroups(!openGroups)}
                className={`${menuBase} ${hoverStyle}`}
              >
                <FiFolder />
                <span className="flex-1">Groups</span>
                <FiPlus
                  onClick={(e) => {
                    e.stopPropagation();
                    setAddingGroup(true);
                  }}
                />
              </div>

              {openGroups && (
                <div className="ml-4 mt-1 space-y-1">
                  {addingGroup && (
                    <input
                      ref={addGroupRef}
                      autoFocus
                      value={newGroupName}
                      onChange={(e) => setNewGroupName(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && newGroupName.trim()) {
                          const res = await fetch(
                            `/api/events/${selectedEvent._id}/groups`,
                            {
                              method: "POST",
                              headers: {
                                "Content-Type": "application/json",
                              },
                              body: JSON.stringify({
                                name: newGroupName,
                                slug: slugify(newGroupName),
                              }),
                            }
                          );

                          if (!res.ok) return;

                          const data = await res.json();
                          setGroups((prev) => [...prev, data]);
                          setAddingGroup(false);
                          setNewGroupName("");
                        }

                        if (e.key === "Escape") {
                          setAddingGroup(false);
                          setNewGroupName("");
                        }
                      }}
                      className="w-[95%] bg-[#2C3B41] px-3 py-2 mt-2 mb-2 rounded"
                    />
                  )}

                  {groups.map((group) => (
                    <div
                      key={group._id}
                      className={`${menuBase} ${selectedGroup?._id === group._id
                        ? activeStyle
                        : hoverStyle
                        }`}
                      onClick={() => {
                        setSelectedGroup(group); // ⭐ เพิ่ม
                        router.push(
                          `/dashboard/${selectedEvent.slug}/${group.slug}`
                        );
                      }}
                    >
                      {/* ACTIVE INDICATOR */}
                      <span
                        className={`${indicator} ${selectedGroup?._id === group._id
                          ? "opacity-100"
                          : "opacity-0"
                          }`}
                      />

                      {/* RENAME INPUT */}
                      {renamingGroup === group._id ? (
                        <input
                          autoFocus
                          value={renameGroupText}
                          onChange={(e) => setRenameGroupText(e.target.value)}
                          onClick={(e) => e.stopPropagation()}
                          onKeyDown={async (e) => {
                            if (e.key === "Enter") {
                              await fetch(`/api/events/${selectedEvent._id}/groups/${group._id}`, {
                                method: "PATCH",
                                headers: {
                                  "Content-Type": "application/json",
                                },
                                body: JSON.stringify({
                                  name: renameGroupText,
                                  slug: slugify(renameGroupText),
                                }),
                              });

                              setGroups((prev) =>
                                prev.map((g) =>
                                  g._id === group._id
                                    ? { ...g, name: renameGroupText }
                                    : g
                                )
                              );
                              setRenamingGroup(null);
                            }
                          }}
                          className="bg-transparent border-b outline-none flex-1"
                        />
                      ) : (
                        <span className="flex-1">{group.name}</span>
                      )}

                      {/* MORE ICON */}
                      <FiMoreVertical
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenGroupMenu(group._id);
                        }}
                      />

                      {/* GROUP MENU */}
                      {openGroupMenu === group._id && (
                        <div
                          ref={groupMenuRef}
                          className="absolute right-2 top-9 bg-[#2C3B41] rounded shadow z-50">
                          <div
                            className="px-4 py-2 hover:bg-black/30"
                            onClick={(e) => {
                              e.stopPropagation();
                              setRenamingGroup(group._id);
                              setRenameGroupText(group.name);
                              setOpenGroupMenu(null);
                            }}
                          >
                            Rename
                          </div>

                          <div
                            className="px-4 py-2 text-red-400 hover:bg-black/30"
                            onClick={async (e) => {
                              e.stopPropagation();
                              await fetch(
                                `/api/events/${selectedEvent._id}/groups/${group._id}`,
                                { method: "DELETE" }
                              );
                              setGroups((prev) =>
                                prev.filter((g) => g._id !== group._id)
                              );
                              setOpenGroupMenu(null);
                            }}
                          >
                            Delete
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/" })}
          className="m-4 flex items-center justify-center gap-2 bg-[#005BA9] text-white rounded-lg py-2"
        >
          <FiLogOut /> Log out
        </button>
      </aside>

      <main className="flex flex-col">
        <header className="h-16 bg-[#005BA9] flex justify-end px-6 items-center">
          <div className="flex items-center gap-3 text-white">
            <div className="w-9 h-9 rounded-full bg-gray-400 flex items-center justify-center">
              <FaUserAlt />
            </div>
            <span>{session?.user?.username}</span>
          </div>
        </header>

        <section className="p-6 flex-1 overflow-auto">
          {children}
        </section>
      </main>
    </div>
  );
}
