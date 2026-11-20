let me = null,
  csrf = null,
  page = "dashboard",
  resources = [],
  bookings = [],
  users = [],
  notices = [];
const $ = (s) => document.querySelector(s),
  esc = (s) =>
    String(s ?? "").replace(
      /[&<>"']/g,
      (c) =>
        ({
          "&": "&amp;",
          "<": "&lt;",
          ">": "&gt;",
          '"': "&quot;",
          "'": "&#39;",
        })[c],
    );
const fmt = (s) =>
    new Date(s).toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    }),
  day = (s) =>
    new Date(s).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }),
  dateInput = () =>
    new Date(Date.now() - new Date().getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
const badge = (s) => `<span class="badge ${esc(s)}">${esc(s)}</span>`,
  brand = () =>
    '<span class="brand"><span class="logo">▦</span>CampusFlow<span style="color:#b4a170">.</span></span>';
async function api(path, method = "GET", body) {
  if (!csrf) csrf = await (await fetch("/api/csrf")).json();
  const headers = {};
  if (method !== "GET") headers[csrf.headerName] = csrf.token;
  if (body && !(body instanceof URLSearchParams))
    headers["Content-Type"] = "application/json";
  const res = await fetch("/api" + path, {
    method,
    headers,
    body:
      body instanceof URLSearchParams
        ? body
        : body
          ? JSON.stringify(body)
          : undefined,
  });
  if (res.status === 204) return null;
  const data = await res.json().catch(() => ({ message: "Request failed" }));
  if (!res.ok) throw Error(data.message || `Request failed (${res.status})`);
  return data;
}
function toast(s) {
  $("#toast").textContent = s;
  $("#toast").style.display = "block";
  setTimeout(() => ($("#toast").style.display = "none"), 4500);
}
function field(label, name, type = "text", value = "", extra = "") {
  return `<div class="field"><label for="${name}">${label}</label><input id="${name}" name="${name}" type="${type}" value="${esc(value)}" ${extra}></div>`;
}
function select(label, name, options, value = "") {
  return `<div class="field"><label for="${name}">${label}</label><select id="${name}" name="${name}">${options.map((o) => `<option ${o === value ? "selected" : ""}>${esc(o)}</option>`).join("")}</select></div>`;
}
function formData(f) {
  return Object.fromEntries(new FormData(f));
}
function bindForm(id, fn) {
  $(id).onsubmit = async (e) => {
    e.preventDefault();
    const f = e.currentTarget,
      button = f.querySelector("button[type=submit]");
    f.querySelector(".error")?.remove();
    if (button) button.disabled = true;
    try {
      await fn(formData(f), f);
    } catch (x) {
      f.insertAdjacentHTML(
        "afterbegin",
        `<div class="error" role="alert">${esc(x.message)}</div>`,
      );
    } finally {
      if (button) button.disabled = false;
    }
  };
}
function landing() {
  me = null;
  $("#root").innerHTML =
    `<div class="landing"><nav>${brand()}<div class="actions"><button class="secondary" onclick="auth('login')">Log in</button><button onclick="auth('register')">Get started</button></div></nav><section class="hero"><div><div class="eyebrow">A smarter way to share your campus</div><h1>Great ideas.<br>Give them<br>a space.</h1><p class="muted">Find the right room, reserve campus equipment, and make your next session happen. One place for every campus resource.</p><div class="actions"><button onclick="auth('register')">Explore your campus</button><button class="secondary" onclick="auth('login')">Sign in to book</button></div><p class="hint">Built for students, faculty, and campus teams.</p></div><div class="hero-art"><div class="eyebrow">Your campus, connected</div><h2>Space to do more.</h2><div class="mini"><span class="badge APPROVED">SPACES & EQUIPMENT</span><h3 style="margin-top:16px">Innovation Lab</h3><p class="muted">40 seats · Smart display · Wi-Fi</p></div><div class="mini"><div class="actions"><span style="color:#b4a170;font-size:30px">▦</span><div><strong>Find. Reserve. Create.</strong><p class="muted" style="margin:5px 0">A clear path from idea to booking.</p></div></div></div></div></section><div class="grid"><div class="card"><div class="eyebrow">01 · Discover</div><h2>The right resource</h2><p class="muted">Browse rooms, labs, sports facilities and equipment with useful filters.</p></div><div class="card"><div class="eyebrow">02 · Reserve</div><h2>Choose your time</h2><p class="muted">Check occupied slots and request a time that works for your team.</p></div><div class="card"><div class="eyebrow">03 · Stay informed</div><h2>Keep everything in view</h2><p class="muted">Track approvals, manage your bookings and receive in-app updates.</p></div></div><footer>CampusFlow · Smart Campus Resource Booking & Management System<br><span class="muted">CSE 213 · Advanced Java Programming · Academic year 2026–27</span></footer></div>`;
}
function auth(mode) {
  const reg = mode === "register";
  $("#root").innerHTML =
    `<div class="auth">${brand()}<h1>${reg ? "Join your campus" : "Welcome back"}</h1><p class="muted">${reg ? "Create an account to find and reserve resources." : "Sign in to manage your campus bookings."}</p><form id="authForm">${reg ? field("Full name", "name", "text", "", "required maxlength=255") : ""}${field("University email", "email", "email", "", "required maxlength=255")}${reg ? field("Registration number / employee ID", "registration", "text", "", "required maxlength=255") + select("Role", "role", ["STUDENT", "FACULTY"]) + field("Department", "department", "text", "", "required maxlength=255") : ""}${field("Password", "password", "password", "", 'required minlength=10 maxlength=100 autocomplete="' + (reg ? "new-password" : "current-password") + '"')}${reg ? field("Confirm password", "confirmPassword", "password", "", "required") : ""}<button type="submit" style="width:100%">${reg ? "Create account" : "Sign in"}</button></form><p class="hint">${reg ? "Already registered?" : "New to CampusFlow?"} <a href="#" onclick="auth('${reg ? "login" : "register"}');return false">${reg ? "Sign in" : "Create an account"}</a></p><a href="#" onclick="landing();return false" class="hint">Back to home</a></div>`;
  bindForm("#authForm", async (d) => {
    if (reg) {
      await api("/register", "POST", d);
      auth("login");
      toast("Account created. Sign in to continue.");
    } else {
      await api(
        "/login",
        "POST",
        new URLSearchParams({ username: d.email, password: d.password }),
      );
      csrf = null;
      me = await api("/me");
      await navigate("dashboard");
    }
  });
}
const navs = [
  ["dashboard", "◫", "Overview"],
  ["resources", "▦", "Resource catalogue"],
  ["bookings", "▤", "My bookings"],
  ["availability", "◷", "Availability"],
  ["notifications", "♧", "Notifications"],
  ["profile", "◎", "My profile"],
];
async function load() {
  resources = await api(
    me.role === "ADMIN" ? "/admin/resources" : "/resources",
  );
  bookings = await api(me.role === "ADMIN" ? "/admin/bookings" : "/bookings");
  notices = await api("/notifications");
  if (me.role === "ADMIN") users = await api("/admin/users");
}
async function navigate(p) {
  page = p;
  try {
    await load();
    shell();
    await renderPage();
  } catch (e) {
    toast(e.message);
  }
}
function shell() {
  const admin = me.role === "ADMIN";
  $("#root").innerHTML =
    `<div class="shell"><aside class="sidebar">${brand()}<div class="nav-label">WORKSPACE</div>${navs
      .filter((n) => !(admin && n[0] === "bookings"))
      .map((n) => navItem(n))
      .join("")}${
      admin
        ? '<div class="nav-label">ADMINISTRATION</div>' +
          [
            ["manage-resources", "▦", "Manage resources"],
            ["requests", "▤", "Booking requests"],
            ["users", "♙", "User management"],
            ["reports", "▥", "Reports & exports"],
          ]
            .map(navItem)
            .join("")
        : ""
    }<div class="sidebar-bottom">SMART CAMPUS<br><p>Make room for what matters.</p><button class="nav-item" onclick="logout()">↪ &nbsp; Sign out</button></div></aside><main class="main"><header class="topbar"><button class="mobile-menu" aria-label="Toggle navigation" onclick="$('.sidebar').classList.toggle('open')">☰</button><span class="breadcrumb">Workspace &nbsp; / &nbsp; ${esc([...navs, ["manage-resources", "", "Manage resources"], ["requests", "", "Booking requests"], ["users", "", "User management"], ["reports", "", "Reports & exports"]].find((n) => n[0] === page)?.[2] || "Overview")}</span><div class="actions"><button class="secondary small" onclick="navigate('notifications')" aria-label="Notifications">♧ ${notices.filter((n) => !n.isRead).length}</button><span class="avatar">${esc(me.name.slice(0, 1))}</span><span class="user-name" style="font-size:13px"><strong>${esc(me.name)}</strong><br><span class="muted">${esc(me.role)}</span></span></div></header><div class="content" id="content"></div></main></div>`;
}
function navItem(n) {
  return `<button class="nav-item ${page === n[0] ? "active" : ""}" onclick="navigate('${n[0]}')"><span class="nav-icon">${n[1]}</span>${n[2]}</button>`;
}
function title(name, desc, action = "") {
  return `<div class="heading"><div><div class="eyebrow">${me.role === "ADMIN" ? "Campus administration" : "Your campus workspace"}</div><h1>${name}</h1><p>${desc}</p></div>${action}</div>`;
}
function stat(label, n, note) {
  return `<div class="stat"><label>${label}</label><div class="number">${n}</div><small>${note}</small></div>`;
}
async function renderPage() {
  if (page === "dashboard") dashboard();
  else if (page === "resources") catalogue();
  else if (page === "bookings" || page === "requests") bookingPage();
  else if (page === "manage-resources") manageResources();
  else if (page === "users") userPage();
  else if (page === "availability") availabilityPage();
  else if (page === "profile") profilePage();
  else if (page === "notifications") notificationsPage();
  else if (page === "reports") await reportPage();
}
function dashboard() {
  const admin = me.role === "ADMIN",
    up = bookings
      .filter(
        (b) =>
          new Date(b.startTime) > new Date() &&
          ["PENDING", "APPROVED"].includes(b.status),
      )
      .sort((a, b) => a.startTime.localeCompare(b.startTime));
  $("#content").innerHTML =
    title(
      admin ? "Campus overview" : "Your overview",
      day(new Date()) + " · Everything you need, in one place.",
    ) +
    `<div class="welcome"><div><div class="eyebrow">WELCOME TO CAMPUSFLOW</div><h2>${admin ? "A clear view of your campus." : "Hello, " + esc(me.name.split(" ")[0]) + ". Make room for your next idea."}</h2><p>${admin ? "Keep resources organised and help campus activities move forward." : "Your next workshop, study session or team meeting starts here."}</p></div><button onclick="navigate('${admin ? "requests" : "resources"}')">${admin ? "Review requests" : "Browse resources"}</button></div><div class="stats">${stat(admin ? "Registered users" : "Total bookings", admin ? users.length : bookings.length, admin ? "Across all departments" : "Your booking history")}${stat("Upcoming bookings", up.length, "Pending & approved sessions")}${stat("Pending requests", bookings.filter((b) => b.status === "PENDING").length, "Awaiting administrator review")}${stat(admin ? "Active resources" : "Approved bookings", admin ? resources.filter((r) => r.active).length : bookings.filter((b) => b.status === "APPROVED").length, admin ? "Open for new requests" : "Ready for your next session")}</div><div class="split"><div class="card"><div class="panel-title"><h2>Recent booking activity</h2><button class="secondary small" onclick="navigate('${admin ? "requests" : "bookings"}')">View all</button></div>${bookingTable([...bookings].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5), false)}</div><div class="card"><div class="panel-title"><h2>Coming up next</h2><span class="eyebrow">${up.length} SESSIONS</span></div>${
      up
        .slice(0, 3)
        .map(
          (b) =>
            `<div class="schedule"><div class="actions" style="justify-content:space-between"><h3>${esc(b.resource.name)}</h3>${badge(b.status)}</div><p>${fmt(b.startTime)} · ${esc(b.resource.location)}</p><p>${esc(b.purpose)}</p></div>`,
        )
        .join("") ||
      '<div class="empty">No upcoming bookings. Find a resource to get started.</div>'
    }<p class="hint">Pending requests reserve the slot while an administrator reviews them.</p></div></div><div class="panel-title section-gap"><h2>${admin ? "Booking status at a glance" : "Discover campus resources"}</h2><button class="secondary small" onclick="navigate('resources')">Explore catalogue</button></div>${
      admin
        ? '<div class="stats">' +
          ["APPROVED", "REJECTED", "CANCELLED", "COMPLETED"]
            .map((s) =>
              stat(
                s,
                bookings.filter((b) => b.status === s).length,
                "All bookings",
              ),
            )
            .join("") +
          "</div>"
        : '<div class="grid">' +
          resources
            .filter((r) => r.active)
            .slice(0, 3)
            .map(resourceCard)
            .join("") +
          "</div>"
    }`;
}
function art(r) {
  return `<div class="resource-art ${r.category === "Sports Facility" ? "sport" : ""}" aria-label="${esc(r.category)} illustration"></div>`;
}
function resourceCard(r) {
  return `<article class="card resource-card">${art(r)}<span class="category">${esc(r.category)}</span><h3>${esc(r.name)}</h3><p>${esc(r.building)} · ${esc(r.location)}</p><p>${r.capacity ? esc(r.capacity) + " capacity" : "Capacity not set"} · ${esc(r.facilities?.split(",")[0] || "Campus resource")}</p><div class="resource-foot"><span class="badge active">ACTIVE RESOURCE</span><button class="small secondary" onclick="details(${r.id})">View details</button></div></article>`;
}
function catalogue() {
  const categories = [...new Set(resources.map((r) => r.category))],
    locations = [...new Set(resources.map((r) => r.building))];
  $("#content").innerHTML =
    title(
      "Find your space",
      "Rooms, labs and equipment for your next campus activity.",
    ) +
    `<div class="filters"><input id="search" aria-label="Search resources" placeholder="Search name or location"><select id="category" aria-label="Filter by category"><option value="">All categories</option>${categories.map((x) => `<option>${esc(x)}</option>`).join("")}</select><select id="location" aria-label="Filter by building"><option value="">All buildings</option>${locations.map((x) => `<option>${esc(x)}</option>`).join("")}</select><input id="capacity" type="number" min="1" aria-label="Minimum capacity" placeholder="Min. capacity"><select id="sort" aria-label="Sort resources"><option value="name">Name A–Z</option><option value="capacity">Capacity: largest</option></select><button class="secondary" onclick="catalogue()">Clear</button></div><p class="hint">Active means open for requests. Check your date and time on the resource details page.</p><div class="grid" id="catalogue"></div>`;
  ["search", "category", "location", "capacity", "sort"].forEach(
    (id) => ($("#" + id).oninput = filterCatalogue),
  );
  filterCatalogue();
}
function filterCatalogue() {
  let a = resources.filter(
    (r) =>
      r.active &&
      (r.name + " " + r.location + " " + r.building)
        .toLowerCase()
        .includes($("#search").value.toLowerCase()) &&
      (!$("#category").value || r.category === $("#category").value) &&
      (!$("#location").value || r.building === $("#location").value) &&
      (!$("#capacity").value || r.capacity >= +$("#capacity").value),
  );
  a.sort(
    $("#sort").value === "capacity"
      ? (a, b) => (b.capacity || 0) - (a.capacity || 0)
      : (a, b) => a.name.localeCompare(b.name),
  );
  $("#catalogue").innerHTML =
    a.map(resourceCard).join("") ||
    '<div class="card empty">No resources match these filters.</div>';
}
function openModal(html) {
  $("#modal").innerHTML =
    '<button class="close small" onclick="closeModal()" aria-label="Close dialog">✕</button>' +
    html;
  $("#modal").showModal();
}
function closeModal() {
  $("#modal").close();
}
async function details(id) {
  const r =
    resources.find((r) => r.id === id) || (await api("/resources/" + id));
  openModal(
    `<div class="eyebrow">${esc(r.category)}</div><h2>${esc(r.name)}</h2>${art(r)}<p>${esc(r.description)}</p><div class="row"><p><strong>Location</strong><br>${esc(r.building)} · ${esc(r.location)}</p><p><strong>Capacity</strong><br>${r.capacity || "Not set"}</p></div><p><strong>Facilities</strong><br>${esc(r.facilities)}</p><p class="hint">Booking rules: future times only; pending and approved requests block the slot. Adjacent bookings are allowed. Do not exceed capacity. Inactive resources cannot accept requests.</p>${field("Check occupied slots for date", "slotDate", "date", dateInput(), "required")}<div id="slots"></div><button onclick="bookingForm(${id})" ${!r.active ? "disabled" : ""}>Request a booking</button>`,
  );
  $("#slotDate").onchange = () => showSlots(id, $("#slotDate").value, "#slots");
  await showSlots(id, $("#slotDate").value, "#slots");
}
async function showSlots(id, date, target) {
  try {
    const a = await api(`/resources/${id}/availability?date=${date}`);
    $(target).innerHTML = a.length
      ? a
          .map(
            (b) =>
              `<div class="schedule">${fmt(b.startTime)} – ${new Date(b.endTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} ${badge(b.status)}</div>`,
          )
          .join("")
      : '<p class="hint">No occupied slots recorded for this date. Availability is rechecked when you submit.</p>';
  } catch (e) {
    $(target).textContent = e.message;
  }
}
function bookingForm(id) {
  const r = resources.find((r) => r.id === id),
    date = $("#slotDate")?.value || dateInput();
  $("#modal").innerHTML =
    `<button class="close small" onclick="closeModal()">✕</button><div class="eyebrow">NEW RESERVATION</div><h2>${esc(r.name)}</h2><p class="hint">${esc(r.building)} · Capacity ${r.capacity || "not set"}</p><form id="bookingForm">${field("Booking date", "date", "date", date, 'required min="' + dateInput() + '"')}<div class="row">${field("Start time", "start", "time", "09:00", "required")}${field("End time", "end", "time", "10:00", "required")}</div>${field("Purpose", "purpose", "text", "", "required maxlength=255")}${field("Attendees", "attendees", "number", "1", "required min=1 " + (r.capacity ? "max=" + r.capacity : ""))}<div class="field"><label for="notes">Additional notes (optional)</label><textarea id="notes" name="notes" maxlength="3000"></textarea></div><p class="hint">Your request reserves the slot immediately and awaits administrator approval.</p><button type="submit">Submit booking request</button></form>`;
  bindForm("#bookingForm", async (d) => {
    await api("/bookings", "POST", {
      resourceId: id,
      startTime: d.date + "T" + d.start + ":00",
      endTime: d.date + "T" + d.end + ":00",
      purpose: d.purpose,
      attendees: +d.attendees,
      notes: d.notes,
    });
    closeModal();
    await navigate("bookings");
    toast("Booking submitted for review.");
  });
}
function bookingTable(a, actions = true) {
  if (!a.length) return '<div class="empty">No bookings to display.</div>';
  return `<div class="table-wrap"><table><thead><tr><th>Resource / purpose</th><th>Date & time</th><th>Status</th>${actions ? "<th>Actions</th>" : ""}</tr></thead><tbody>${a.map((b) => `<tr><td><strong>${esc(b.resource.name)}</strong><small>${esc(b.purpose)}</small>${me.role === "ADMIN" ? "<small>" + esc(b.user.name) + "</small>" : ""}<small>${esc(b.resource.building)} · ${esc(b.resource.location)}</small></td><td>${day(b.startTime)}<small>${new Date(b.startTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} – ${new Date(b.endTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}</small></td><td>${badge(b.status)}${b.rejectionReason ? "<small>" + esc(b.rejectionReason) + "</small>" : ""}</td>${actions ? `<td><div class="actions"><button class="small secondary" onclick="bookingDetails(${b.id})">Details</button>${me.role === "ADMIN" && b.status === "PENDING" ? `<button class="small" onclick="decide(${b.id},'APPROVED')">Approve</button><button class="small secondary" onclick="decide(${b.id},'REJECTED')">Reject</button>` : b.user.id === me.id && ["PENDING", "APPROVED"].includes(b.status) && new Date(b.startTime) > new Date() ? `<button class="small secondary" onclick="cancelBooking(${b.id})">Cancel</button>` : ""}${me.role === "ADMIN" && b.status === "APPROVED" && new Date(b.endTime) < new Date() ? `<button class="small" onclick="decide(${b.id},'COMPLETED')">Complete</button>` : ""}</div></td>` : ""}</tr>`).join("")}</tbody></table></div>`;
}
function bookingDetails(id) {
  const b = bookings.find((x) => x.id === id);
  openModal(
    `<h2>Booking #${id}</h2>${badge(b.status)}<h3 style="margin-top:20px">${esc(b.resource.name)}</h3><p>${fmt(b.startTime)} – ${fmt(b.endTime)}</p><p><strong>Purpose:</strong> ${esc(b.purpose)}</p><p><strong>Attendees:</strong> ${b.attendees || "Not specified"}</p><p><strong>Notes:</strong> ${esc(b.notes || "None")}</p><p><strong>Requested by:</strong> ${esc(b.user.name)}</p>${b.rejectionReason ? "<p>Rejection reason: " + esc(b.rejectionReason) + "</p>" : ""}`,
  );
}
function bookingPage(initialResource = "", initialUser = "") {
  const admin = page === "requests";
  $("#content").innerHTML =
    title(
      admin ? "Booking requests" : "My bookings",
      admin
        ? "Review requests and keep campus activities running smoothly."
        : "Your reservations, from first request to completed session.",
      admin
        ? '<button class="secondary" onclick="exportBookings()">Export CSV</button>'
        : "<button onclick=\"navigate('resources')\">New booking</button>",
    ) +
    `<div class="filters"><input id="bs" placeholder="Search bookings" aria-label="Search bookings"><select id="bst" aria-label="Booking status"><option value="">All statuses</option>${["PENDING", "APPROVED", "REJECTED", "CANCELLED", "COMPLETED"].map((x) => "<option>" + x + "</option>").join("")}</select><select id="border" aria-label="Sort booking dates"><option value="upcoming">Upcoming first</option><option value="past">Latest date first</option></select>${admin ? `<input type="date" id="bd" aria-label="Booking date"><select id="br" aria-label="Resource"><option value="">All resources</option>${resources.map((r) => `<option value="${r.id}" ${String(r.id) === String(initialResource) ? "selected" : ""}>${esc(r.name)}</option>`).join("")}</select><select id="bu" aria-label="User"><option value="">All users</option>${users.map((u) => `<option value="${u.id}" ${String(u.id) === String(initialUser) ? "selected" : ""}>${esc(u.name)}</option>`).join("")}</select>` : ""}<button class="secondary" onclick="bookingPage()">Clear</button></div><div class="card" id="bookingRows"></div>`;
  ["bs", "bst", "border", "bd", "br", "bu"].forEach((x) => {
    if ($("#" + x)) $("#" + x).oninput = filterBookings;
  });
  filterBookings();
}
function filterBookings() {
  let a = bookings.filter(
    (b) =>
      (page === "requests" || b.user.id === me.id) &&
      (!$("#bst").value || b.status === $("#bst").value) &&
      (b.resource.name + " " + b.purpose + " " + b.user.name)
        .toLowerCase()
        .includes($("#bs").value.toLowerCase()) &&
      (!$("#bd")?.value || b.startTime.slice(0, 10) === $("#bd").value) &&
      (!$("#br")?.value || String(b.resource.id) === $("#br").value) &&
      (!$("#bu")?.value || String(b.user.id) === $("#bu").value),
  );
  a.sort((a, b) =>
    $("#border").value === "past"
      ? b.startTime.localeCompare(a.startTime)
      : (new Date(a.startTime) < new Date()) -
          (new Date(b.startTime) < new Date()) ||
        a.startTime.localeCompare(b.startTime),
  );
  $("#bookingRows").innerHTML = bookingTable(a);
}
function exportBookings() {
  const q = new URLSearchParams({
    status: $("#bst")?.value || "",
    search: $("#bs")?.value || "",
    date: $("#bd")?.value || "",
    resource: $("#br")?.value || "",
    person: $("#bu")?.value || "",
  });
  window.location = "/api/admin/export/bookings?" + q;
}
async function cancelBooking(id) {
  if (!confirm("Cancel this booking and release the time slot?")) return;
  try {
    await api("/bookings/" + id + "/cancel", "POST");
    await navigate(page);
    toast("Booking cancelled. History retained.");
  } catch (e) {
    toast(e.message);
  }
}
async function decide(id, status) {
  let reason = null;
  if (status === "REJECTED") {
    reason = prompt("Reason for rejecting this booking:");
    if (reason === null) return;
  } else if (
    !confirm(
      status === "APPROVED"
        ? "Approve this booking?"
        : "Mark this ended booking completed?",
    )
  )
    return;
  try {
    await api("/admin/bookings/" + id + "/decision", "POST", {
      status,
      reason,
    });
    await navigate(page);
    toast("Booking " + status.toLowerCase());
  } catch (e) {
    toast(e.message);
  }
}
function manageResources() {
  $("#content").innerHTML =
    title(
      "Manage resources",
      "Deactivation preserves booking history and existing reservations.",
      '<button onclick="resourceForm()">Add resource</button>',
    ) +
    `<div class="filters"><input id="rs" placeholder="Search name or location" aria-label="Search resources"><select id="ra" aria-label="Resource status"><option value="">All statuses</option><option value="active">Active</option><option value="inactive">Inactive</option></select><button class="secondary" onclick="window.location='/api/admin/export/resources?search='+encodeURIComponent($('#rs').value)">Export CSV</button></div><div class="card" id="resourceRows"></div>`;
  $("#rs").oninput = resourceRows;
  $("#ra").onchange = resourceRows;
  resourceRows();
}
function resourceRows() {
  const a = resources.filter(
    (r) =>
      (r.name + " " + r.building + " " + r.location)
        .toLowerCase()
        .includes($("#rs").value.toLowerCase()) &&
      (!$("#ra").value || r.active === ($("#ra").value === "active")),
  );
  $("#resourceRows").innerHTML =
    `<div class="table-wrap"><table><thead><tr><th>Resource</th><th>Category</th><th>Capacity</th><th>Status</th><th>Actions</th></tr></thead><tbody>${a.map((r) => `<tr><td><strong>${esc(r.name)}</strong><small>${esc(r.building)} · ${esc(r.location)}</small></td><td>${esc(r.category)}</td><td>${r.capacity || "—"}</td><td>${badge(r.active ? "active" : "inactive")}</td><td><div class="actions"><button class="secondary small" onclick="resourceForm(${r.id})">Edit</button><button class="secondary small" onclick="resourceHistory(${r.id})">History</button></div></td></tr>`).join("")}</tbody></table></div>`;
}
async function resourceHistory(id) {
  page = "requests";
  shell();
  bookingPage(id);
}
function resourceForm(id) {
  const r = resources.find((r) => r.id === id) || {};
  openModal(
    `<h2>${id ? "Edit" : "Add"} resource</h2><form id="resourceForm">${field("Resource name", "name", "text", r.name || "", "required maxlength=255")}${select("Category", "category", ["Classroom", "Seminar Hall", "Laboratory", "Conference Room", "Sports Facility", "Equipment", "Other"], r.category)}<div class="row">${field("Building", "building", "text", r.building || "", "required maxlength=255")}${field("Room / location", "location", "text", r.location || "", "required maxlength=255")}</div>${field("Capacity (optional)", "capacity", "number", r.capacity || "", "min=1")}${field("Facilities", "facilities", "text", r.facilities || "", "maxlength=255")}<div class="field"><label for="description">Description</label><textarea name="description" id="description" maxlength="3000">${esc(r.description || "")}</textarea></div>${field("Optional image URL (stored for future use)", "imageUrl", "url", r.imageUrl || "", "maxlength=255")}${select("Status", "active", ["Active", "Inactive"], r.active === false ? "Inactive" : "Active")}<p class="hint">Deactivation blocks new requests; existing bookings remain in history and are not silently cancelled.</p><button type="submit">Save resource</button></form>`,
  );
  bindForm("#resourceForm", async (d) => {
    if (
      id &&
      r.active &&
      d.active === "Inactive" &&
      !confirm("Deactivate this resource? Existing bookings remain unchanged.")
    )
      return;
    await api("/admin/resources" + (id ? "/" + id : ""), id ? "PUT" : "POST", {
      ...d,
      capacity: d.capacity ? +d.capacity : null,
      active: d.active === "Active",
    });
    closeModal();
    await navigate("manage-resources");
    toast("Resource saved");
  });
}
function userPage() {
  $("#content").innerHTML =
    title(
      "User management",
      "Manage access and review campus booking activity.",
    ) +
    `<div class="filters"><input id="us" placeholder="Search name, email or university ID" aria-label="Search users"><select id="ur" aria-label="Filter user role"><option value="">All roles</option><option>STUDENT</option><option>FACULTY</option><option>ADMIN</option></select></div><div class="card" id="userRows"></div>`;
  $("#us").oninput = userRows;
  $("#ur").onchange = userRows;
  userRows();
}
function userRows() {
  const a = users.filter(
    (u) =>
      (u.name + " " + u.email + " " + u.registration)
        .toLowerCase()
        .includes($("#us").value.toLowerCase()) &&
      (!$("#ur").value || u.role === $("#ur").value),
  );
  $("#userRows").innerHTML =
    `<div class="table-wrap"><table><thead><tr><th>Name / email</th><th>University ID</th><th>Role</th><th>Status</th><th>Actions</th></tr></thead><tbody>${a.map((u) => `<tr><td><strong>${esc(u.name)}</strong><small>${esc(u.email)}</small><small>${esc(u.department)}</small></td><td>${esc(u.registration)}</td><td>${badge(u.role)}</td><td>${badge(u.active ? "active" : "inactive")}</td><td><div class="actions"><button class="small secondary" onclick="userHistory(${u.id})">History</button>${u.id !== me.id ? `<button class="small secondary" onclick="toggleUser(${u.id})">${u.active ? "Deactivate" : "Activate"}</button>` : "<small>Your account</small>"}</div></td></tr>`).join("")}</tbody></table></div>`;
}
function userHistory(id) {
  page = "requests";
  shell();
  bookingPage("", id);
}
async function toggleUser(id) {
  const u = users.find((x) => x.id === id);
  if (
    !confirm(
      (u.active ? "Deactivate " : "Activate ") +
        u.name +
        "? Existing bookings remain unchanged.",
    )
  )
    return;
  try {
    await api("/admin/users/" + id + "/active", "POST", { active: !u.active });
    await navigate("users");
    toast("Account updated");
  } catch (e) {
    toast(e.message);
  }
}
function availabilityPage() {
  $("#content").innerHTML =
    title(
      "Plan your next session",
      "Choose a resource and date to see occupied time slots.",
    ) +
    `<div class="card"><div class="row"><div class="field"><label for="avResource">Resource</label><select id="avResource">${resources
      .filter((r) => r.active)
      .map((r) => `<option value="${r.id}">${esc(r.name)}</option>`)
      .join(
        "",
      )}</select></div>${field("Date", "avDate", "date", dateInput(), "required")}</div><div id="avSlots"></div><p class="hint">Pending and approved slots are occupied. Other times can be requested, subject to backend validation. Back-to-back bookings are allowed.</p><button onclick="details(+$('#avResource').value)">View resource & book</button></div>`;
  const update = () =>
    $("#avResource").value &&
    showSlots($("#avResource").value, $("#avDate").value, "#avSlots");
  $("#avResource").onchange = update;
  $("#avDate").onchange = update;
  update();
}
function notificationsPage() {
  $("#content").innerHTML =
    title("Notifications", "Updates about your campus reservations.") +
    `<div class="card">${notices.map((n) => `<div class="notification ${n.isRead ? "" : "unread"}"><div><strong>${esc(n.title)}</strong><p>${esc(n.message)}</p><small>${fmt(n.createdAt)} · ${n.isRead ? "Read" : "Unread"}</small></div>${!n.isRead ? `<button class="small secondary" onclick="markRead(${n.id})">Mark read</button>` : ""}</div>`).join("") || '<div class="empty">You’re all caught up. Booking updates will appear here.</div>'}</div>`;
}
async function markRead(id) {
  await api("/notifications/" + id + "/read", "POST");
  await navigate("notifications");
}
function profilePage() {
  $("#content").innerHTML =
    title("My profile", "Keep your campus details up to date.") +
    `<div class="split"><div class="card"><h2>Account details</h2><p class="hint">${esc(me.email)} · ${esc(me.role)}</p><form id="profileForm">${field("Full name", "name", "text", me.name, "required maxlength=255")}${field("Department", "department", "text", me.department, "required maxlength=255")}${field("Registration / employee ID", "registration", "text", me.registration, "required maxlength=255")}<button type="submit">Save changes</button></form></div><div class="card"><h2>Change password</h2><form id="passwordForm">${field("Current password", "currentPassword", "password", "", "required autocomplete=current-password")}${field("New password", "newPassword", "password", "", "required minlength=10 maxlength=100 autocomplete=new-password")}<p class="hint">Use at least 10 characters.</p><button type="submit">Update password</button></form></div></div>`;
  bindForm("#profileForm", async (d) => {
    me = await api("/me", "PUT", d);
    await navigate("profile");
    toast("Profile updated");
  });
  bindForm("#passwordForm", async (d, f) => {
    await api("/me/password", "POST", d);
    f.reset();
    toast("Password updated");
  });
}
async function reportPage() {
  const d = await api("/admin/reports");
  const bars = (arr, key) => {
    const max = Math.max(1, ...arr.map((x) => Number(x.TOTAL ?? x.total)));
    return (
      arr
        .map((x) => {
          const n = Number(x.TOTAL ?? x.total);
          return `<div class="bar-row"><span>${esc(x[key] ?? x[key.toLowerCase()])}</span><span class="bar"><i style="width:${(n / max) * 100}%"></i></span><strong>${n}</strong></div>`;
        })
        .join("") || '<p class="empty">No data yet.</p>'
    );
  };
  $("#content").innerHTML =
    title(
      "Reports & exports",
      "Live database summaries, queried with Spring JdbcTemplate.",
      '<button class="secondary" onclick="navigate(\'requests\')">Filter & export bookings</button>',
    ) +
    `<div class="row"><div class="card"><h2>Bookings by status</h2>${bars(d.byStatus, "STATUS")}</div><div class="card"><h2>Most booked resources</h2>${bars(d.byResource, "NAME")}</div><div class="card"><h2>Bookings by date</h2>${bars(d.byDate, "BOOKING_DATE")}</div><div class="card"><h2>User booking activity</h2>${bars(d.byUser, "NAME")}</div></div><p class="hint">All counts include booking history. Open Booking requests to filter by date, resource, user and status before exporting CSV.</p>`;
}
async function logout() {
  await api("/logout", "POST");
  csrf = null;
  landing();
}
(async () => {
  try {
    me = await api("/me");
    await navigate("dashboard");
  } catch {
    landing();
  }
})();
