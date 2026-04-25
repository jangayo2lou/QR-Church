"use client";

import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import Swal from "sweetalert2";
import { AdminShell } from "@/components/admin-shell";
import { RequireAdmin } from "@/components/require-admin";
import { apiFetch } from "@/lib/api-client";
import { CustomSelect } from "@/components/ui/custom-select";
import { CustomCalendar } from "@/components/ui/custom-calendar";

const PAGE_SIZE = 12;

const initialForm = {
  last_name: "",
  first_name: "",
  middle_name: "",
  address: "",
  date_of_birth: "",
  sex: "Male",
  age: "",
  contact_number: "",
};

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function levenshteinDistance(a, b) {
  if (!a.length) return b.length;
  if (!b.length) return a.length;

  const prev = new Array(b.length + 1).fill(0);
  const curr = new Array(b.length + 1).fill(0);

  for (let j = 0; j <= b.length; j += 1) prev[j] = j;

  for (let i = 1; i <= a.length; i += 1) {
    curr[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    for (let j = 0; j <= b.length; j += 1) prev[j] = curr[j];
  }

  return prev[b.length];
}

function fuzzyIncludes(haystack, needle) {
  if (!needle) return true;
  if (haystack.includes(needle)) return true;

  const maxDistance = needle.length <= 4 ? 1 : 2;
  const words = haystack.split(" ").filter(Boolean);

  return words.some((word) => {
    if (Math.abs(word.length - needle.length) > maxDistance) return false;
    return levenshteinDistance(word, needle) <= maxDistance;
  });
}

function matchesQuery(values, query) {
  const normalizedQuery = normalizeText(query);
  if (!normalizedQuery) return true;

  const terms = normalizedQuery.split(" ").filter(Boolean);
  const normalizedValues = values.map(normalizeText).filter(Boolean);
  if (!normalizedValues.length) return false;

  return terms.every((term) =>
    normalizedValues.some((value) => fuzzyIncludes(value, term)),
  );
}

function fullName(member) {
  return `${member.last_name}, ${member.first_name} ${member.middle_name}`;
}

function getAvatarUrl(member) {
  if (!member?.avatar_path) return null;
  const bucket =
    process.env.NEXT_PUBLIC_SUPABASE_AVATAR_BUCKET || "member-avatars";
  return `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${member.avatar_path}`;
}

export default function MembersPage() {
  const [members, setMembers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [sexFilter, setSexFilter] = useState("all");
  const [page, setPage] = useState(1);

  // Edit State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState(initialForm);
  const [editAvatar, setEditAvatar] = useState(null);
  const [editAvatarPreview, setEditAvatarPreview] = useState(null);
  const [removeAvatar, setRemoveAvatar] = useState(false);

  const handleEditAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setEditAvatar(file);
      setEditAvatarPreview(URL.createObjectURL(file));
      setRemoveAvatar(false);
    } else {
      setEditAvatar(null);
      setEditAvatarPreview(getAvatarUrl(editingMember));
      setRemoveAvatar(false);
    }
  };

  const handleRemovePhoto = () => {
    setEditAvatar(null);
    setEditAvatarPreview(null);
    setRemoveAvatar(true);
  };

  async function loadMembers() {
    const data = await apiFetch("/api/members");
    setMembers(data.members || []);
  }

  useEffect(() => {
    loadMembers().catch(() => null);
  }, []);

  const activeMembers = members.filter((member) => member.is_active !== false);

  const filteredMembers = useMemo(() => {
    return activeMembers.filter((member) => {
      if (sexFilter !== "all" && member.sex !== sexFilter) return false;

      return matchesQuery(
        [
          fullName(member),
          member.address,
          member.contact_number,
          member.sex,
          String(member.age || ""),
        ],
        search,
      );
    });
  }, [activeMembers, search, sexFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredMembers.length / PAGE_SIZE));

  useEffect(() => {
    setPage(1);
  }, [search, sexFilter]);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  const paginatedMembers = useMemo(() => {
    const start = (page - 1) * PAGE_SIZE;
    return filteredMembers.slice(start, start + PAGE_SIZE);
  }, [filteredMembers, page]);

  async function handleDelete(member) {
    const result = await Swal.fire({
      title: "Are you sure?",
      text: `Do you want to archive ${fullName(member)}? They will no longer appear in attendance scans.`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonText: "Yes, archive",
      cancelButtonText: "Keep them",
      reverseButtons: true,
    });

    if (result.isConfirmed) {
      try {
        await apiFetch(`/api/members?id=${member.id}`, { method: "DELETE" });
        Swal.fire(
          "Archived!",
          "The member has been safely removed.",
          "success",
        );
        await loadMembers();
      } catch (error) {
        Swal.fire("Error", error.message, "error");
      }
    }
  }

  function openEditModal(member) {
    setEditingMember(member);
    setEditForm({
      last_name: member.last_name,
      first_name: member.first_name,
      middle_name: member.middle_name,
      address: member.address,
      date_of_birth: member.date_of_birth,
      sex: member.sex,
      age: member.age,
      contact_number: member.contact_number || "",
    });
    setEditAvatar(null);
    setRemoveAvatar(false);
    setEditAvatarPreview(getAvatarUrl(member));
    setIsEditModalOpen(true);
  }

  async function handleUpdate(event) {
    event.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData();
      formData.set("id", editingMember.id);
      Object.entries(editForm).forEach(([key, value]) =>
        formData.set(key, value),
      );
      if (editAvatar) {
        formData.set("avatar", editAvatar);
      } else if (!removeAvatar && editingMember.avatar_path) {
        formData.set("avatar_path", editingMember.avatar_path);
      }

      await apiFetch("/api/members", {
        method: "PATCH",
        body: formData,
      });

      setIsEditModalOpen(false);
      Swal.fire(
        "Updated!",
        "Member profile has been successfully updated.",
        "success",
      );
      await loadMembers();
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <RequireAdmin>
      <AdminShell title="Members">
        <div className="w-full space-y-5 lg:space-y-6">
          {/* ── Page Header ── */}
          <section className="surface border-l-4 border-[#C9A84C] px-5 py-5 lg:px-6 lg:py-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#9D7B32]">
                  Member Records
                </p>
                <h2
                  className="mt-1 text-[24px] font-semibold leading-tight text-[#1A1A2E] sm:text-[30px]"
                  style={{ fontFamily: "var(--font-display), serif" }}
                >
                  Member Directory
                </h2>
              </div>
              <span className="rounded-full bg-[#FDF6E3] px-3 py-1.5 text-xs font-semibold text-[#9D7B32] sm:px-4 sm:text-sm">
                {activeMembers.length}&nbsp;active&nbsp;
                {activeMembers.length === 1 ? "member" : "members"}
              </span>
            </div>
          </section>

          {/* ── Members Table ── */}
          <section className="surface overflow-hidden">
            <div className="border-b border-[#E8E2D9] bg-[#FCFAF6] px-4 py-3">
              <div className="flex flex-wrap items-center gap-2 sm:gap-2.5">
                <div className="relative min-w-0 basis-full md:flex-1">
                  <svg
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9D7B32]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="m21 21-4.35-4.35m1.85-5.15a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <input
                    type="search"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search members (typo-friendly)"
                    className="h-[44px] w-full rounded-xl border border-[#E8E2D9] bg-white py-2 pl-9 pr-3 text-sm font-medium text-[#1A1A2E] outline-none transition focus:border-[#C9A84C] focus:ring-2 focus:ring-[#C9A84C]/25"
                  />
                </div>

                <div className="w-full sm:w-[48%] md:w-[200px]">
                  <CustomSelect
                    value={sexFilter}
                    options={[
                      { label: "All Sexes", value: "all" },
                      { label: "Male", value: "Male" },
                      { label: "Female", value: "Female" },
                    ]}
                    onChange={setSexFilter}
                    compact
                  />
                </div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm">
                <thead className="bg-[#F5F2EC] text-left">
                  <tr>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#4A5568]">
                      Name
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#4A5568]">
                      Details
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#4A5568]">
                      Address
                    </th>
                    <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-[#4A5568]">
                      Contact
                    </th>
                    <th className="px-5 py-3.5 text-right text-[11px] font-bold uppercase tracking-wider text-[#4A5568]">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedMembers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-5 py-16 text-center">
                        <div className="mx-auto flex max-w-xs flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-[#E8E2D9] py-10">
                          <svg
                            className="h-10 w-10 text-[#C9A84C] opacity-40"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                          </svg>
                          <p className="text-sm font-semibold text-[#4A5568]">
                            No members match your current search/filters
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    paginatedMembers.map((member) => {
                      const avatarUrl = getAvatarUrl(member);
                      return (
                        <tr
                          key={member.id}
                          className="border-t border-[#E8E2D9] text-[#4A5568] transition-colors hover:bg-[#FDFCF8]"
                        >
                          {/* Avatar + Name */}
                          <td className="px-5 py-3.5">
                            <div className="flex items-center gap-3">
                              <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-xl bg-[#F5F2EC]">
                                {avatarUrl ? (
                                  <Image
                                    src={avatarUrl}
                                    alt={fullName(member)}
                                    fill
                                    className="object-cover"
                                    unoptimized
                                  />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center text-sm font-black text-[#C9A84C]">
                                    {member.last_name?.[0] || "?"}
                                  </div>
                                )}
                              </div>
                              <div>
                                <p className="font-semibold text-[#1A1A2E]">
                                  {fullName(member)}
                                </p>
                                <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#9D7B32]">
                                  ID {member.id}
                                </p>
                              </div>
                            </div>
                          </td>

                          {/* Details */}
                          <td className="px-5 py-3.5">
                            <p className="font-medium text-[#4A5568]">
                              {member.sex}&nbsp;&middot;&nbsp;{member.age} yrs
                            </p>
                            <p className="text-xs text-[#4A5568] opacity-60">
                              Birthday: {member.date_of_birth}
                            </p>
                          </td>

                          {/* Address */}
                          <td className="max-w-55 px-5 py-3.5 text-xs leading-relaxed text-[#4A5568]">
                            {member.address}
                          </td>

                          {/* Contact */}
                          <td className="px-5 py-3.5 text-xs font-medium text-[#4A5568]">
                            {member.contact_number || (
                              <span className="italic opacity-40">Not set</span>
                            )}
                          </td>

                          {/* Actions */}
                          <td className="px-5 py-3.5">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => openEditModal(member)}
                                className="rounded-lg border border-[#1E3A5F]/20 bg-[#EFF6FF] px-3 py-1.5 text-xs font-semibold text-[#1E3A5F] transition hover:bg-[#1E3A5F] hover:text-white"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(member)}
                                className="rounded-lg border border-red-200 bg-white px-3 py-1.5 text-xs font-semibold text-red-600 transition hover:bg-red-50"
                              >
                                Archive
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {filteredMembers.length > 0 && (
              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E8E2D9] px-5 py-3">
                <span className="text-xs font-semibold text-[#9D7B32]">
                  Showing {paginatedMembers.length} of {filteredMembers.length}{" "}
                  {filteredMembers.length === 1 ? "member" : "members"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.max(1, prev - 1))}
                    disabled={page === 1}
                    className="rounded-lg border border-[#E8E2D9] px-3 py-1.5 text-xs font-semibold text-[#4A5568] transition enabled:hover:bg-[#FDF6E3] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <span className="text-xs font-semibold text-[#4A5568]">
                    Page {page} / {totalPages}
                  </span>
                  <button
                    type="button"
                    onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}
                    disabled={page === totalPages}
                    className="rounded-lg border border-[#E8E2D9] px-3 py-1.5 text-xs font-semibold text-[#4A5568] transition enabled:hover:bg-[#FDF6E3] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </section>
        </div>

        {/* ── Edit Modal ── */}
        {isEditModalOpen && (
          <div className="modal-backdrop">
            <div className="modal-content max-w-3xl!">
              {/* Modal Header */}
              <header className="mb-8 flex items-start justify-between">
                <div>
                  <h2
                    className="text-[28px] font-semibold leading-tight text-[#1A1A2E]"
                    style={{ fontFamily: "var(--font-display), serif" }}
                  >
                    Edit Member Profile
                  </h2>
                  <p className="mt-1 text-[11px] font-bold uppercase tracking-[0.22em] text-[#9D7B32]">
                    Update Member Details
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="rounded-full p-2 text-[#4A5568] transition-colors hover:bg-[#FDF6E3] hover:text-[#9D7B32]"
                  aria-label="Close modal"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="22"
                    height="22"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M18 6 6 18" />
                    <path d="m6 6 12 12" />
                  </svg>
                </button>
              </header>

              <form onSubmit={handleUpdate} className="space-y-6">
                {/* Photo + Names Row */}
                <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
                  {/* Photo Upload Box */}
                  <div className="flex w-full shrink-0 flex-col gap-2 sm:w-auto">
                    <label className="label-2026">Profile Photo</label>
                    <div className="relative flex h-40 w-full items-center justify-center overflow-hidden rounded-3xl border-2 border-dashed border-[#C9A84C]/50 bg-[#FDFCF8] transition hover:border-[#C9A84C] hover:bg-white sm:w-40">
                      {editAvatarPreview ? (
                        <img
                          src={editAvatarPreview}
                          alt="Preview"
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center gap-2 text-[#C9A84C]">
                          <svg
                            className="h-9 w-9 opacity-60"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                            />
                          </svg>
                          <span className="text-center text-[10px] font-bold uppercase tracking-widest">
                            Upload Photo
                          </span>
                        </div>
                      )}
                      <input
                        type="file"
                        accept="image/*"
                        className="absolute inset-0 cursor-pointer opacity-0"
                        onChange={handleEditAvatarChange}
                      />
                    </div>
                    {editAvatarPreview && (
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        className="mt-1 text-center text-[11px] font-bold uppercase tracking-widest text-red-500 hover:text-red-700"
                      >
                        Remove Photo
                      </button>
                    )}
                  </div>

                  {/* Names */}
                  <div className="mt-1 w-full flex-1 space-y-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div>
                        <label className="label-2026">First Name</label>
                        <input
                          className="input-2026"
                          placeholder="Jane"
                          value={editForm.first_name}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              first_name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                      <div>
                        <label className="label-2026">Last Name</label>
                        <input
                          className="input-2026"
                          placeholder="Doe"
                          value={editForm.last_name}
                          onChange={(e) =>
                            setEditForm({
                              ...editForm,
                              last_name: e.target.value,
                            })
                          }
                          required
                        />
                      </div>
                    </div>
                    <div>
                      <label className="label-2026">Middle Name</label>
                      <input
                        className="input-2026"
                        placeholder="Elizabeth"
                        value={editForm.middle_name}
                        onChange={(e) =>
                          setEditForm({
                            ...editForm,
                            middle_name: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                  </div>
                </div>

                {/* Demographics Row */}
                <div className="grid gap-5 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <CustomCalendar
                      label="Birthday"
                      value={editForm.date_of_birth}
                      onChange={(val) =>
                        setEditForm({ ...editForm, date_of_birth: val })
                      }
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <label className="label-2026">Age</label>
                    <input
                      type="number"
                      className="input-2026"
                      placeholder="0"
                      value={editForm.age}
                      onChange={(e) =>
                        setEditForm({ ...editForm, age: e.target.value })
                      }
                      required
                    />
                  </div>
                  <div className="sm:col-span-4">
                    <CustomSelect
                      label="Sex"
                      value={editForm.sex}
                      options={["Male", "Female"]}
                      onChange={(val) => setEditForm({ ...editForm, sex: val })}
                    />
                  </div>
                </div>

                {/* Contact & Address Row */}
                <div className="grid gap-5 sm:grid-cols-12">
                  <div className="sm:col-span-5">
                    <label className="label-2026">Contact Number</label>
                    <input
                      className="input-2026"
                      placeholder="+63 9xx xxxx xxx"
                      value={editForm.contact_number}
                      onChange={(e) =>
                        setEditForm({
                          ...editForm,
                          contact_number: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="sm:col-span-7">
                    <label className="label-2026">Home Address</label>
                    <input
                      className="input-2026"
                      placeholder="Complete address..."
                      value={editForm.address}
                      onChange={(e) =>
                        setEditForm({ ...editForm, address: e.target.value })
                      }
                      required
                    />
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-8 flex gap-3">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="btn-ghost flex-1 py-4 font-bold"
                  >
                    Discard Changes
                  </button>
                  <button
                    disabled={saving}
                    className="btn-primary flex-[2] py-4 shadow-lg"
                  >
                    {saving ? "Updating…" : "Save Profile Updates"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </AdminShell>
    </RequireAdmin>
  );
}
