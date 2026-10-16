
alert("JavaScript is working!");
const STORAGE_KEY = "jobtrack_applications";

let jobs = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]");
let statusChart = null;

const formPanel = document.getElementById("formPanel");
const jobForm = document.getElementById("jobForm");
const jobTable = document.getElementById("jobTable");
const empty = document.getElementById("empty");

function escapeHTML(value) {
    return String(value).replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function saveJobs() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(jobs));
}

function showForm() {
    jobForm.reset();
    document.getElementById("editId").value = "";
    document.getElementById("formTitle").textContent =
        "Add New Application";
    document.getElementById("date").value =
        new Date().toLocaleDateString("en-CA");
    formPanel.hidden = false;
    formPanel.scrollIntoView({ behavior: "smooth", block: "center" });
    document.getElementById("company").focus();
}

function hideForm() {
    formPanel.hidden = true;
    jobForm.reset();
}

jobForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const editId = document.getElementById("editId").value;

    const job = {
        id: editId || (
            window.crypto && crypto.randomUUID
                ? crypto.randomUUID()
                : String(Date.now()) + Math.random()
        ),
        company: document.getElementById("company").value.trim(),
        role: document.getElementById("role").value.trim(),
        date: document.getElementById("date").value,
        status: document.getElementById("status").value
    };

    if (!job.company || !job.role || !job.date) {
        alert("Please fill in all required fields.");
        return;
    }

    if (editId) {
        jobs = jobs.map(item => item.id === editId ? job : item);
    } else {
        jobs.push(job);
    }

    saveJobs();
    renderJobs();
    updateDashboard();
    hideForm();
});

function editJob(id) {
    const job = jobs.find(item => item.id === id);
    if (!job) return;

    document.getElementById("editId").value = job.id;
    document.getElementById("company").value = job.company;
    document.getElementById("role").value = job.role;
    document.getElementById("date").value = job.date;
    document.getElementById("status").value = job.status;
    document.getElementById("formTitle").textContent =
        "Edit Application";

    formPanel.hidden = false;
    formPanel.scrollIntoView({ behavior: "smooth", block: "center" });
}

function deleteJob(id) {
    const job = jobs.find(item => item.id === id);
    if (!job) return;

    if (confirm("Delete the application for " + job.company + "?")) {
        jobs = jobs.filter(item => item.id !== id);
        saveJobs();
        renderJobs();
        updateDashboard();
    }
}

function renderJobs() {
    const query = document.getElementById("search")
        .value.trim().toLowerCase();

    const filter = document.getElementById("filter").value;

    const filteredJobs = jobs.filter(job => {
        const matchesSearch =
            job.company.toLowerCase().includes(query) ||
            job.role.toLowerCase().includes(query);

        const matchesStatus =
            filter === "All" || job.status === filter;

        return matchesSearch && matchesStatus;
    });

    jobTable.innerHTML = filteredJobs.map(job => `
        <tr>
            <td>
                <div class="company-name">
                    ${escapeHTML(job.company)}
                </div>
                <div class="company-sub">Job application</div>
            </td>
            <td>${escapeHTML(job.role)}</td>
            <td>${escapeHTML(job.date)}</td>
            <td>
                <span class="status status-${job.status.toLowerCase()}">
                    ${escapeHTML(job.status)}
                </span>
            </td>
            <td>
                <button class="action-btn"
                    onclick="editJob('${job.id}')">Edit</button>
                <button class="action-btn delete-btn"
                    onclick="deleteJob('${job.id}')">Delete</button>
            </td>
        </tr>
    `).join("");

    empty.hidden = filteredJobs.length !== 0;
}

function updateDashboard() {
    const total = jobs.length;
    const interviews = jobs.filter(
        job => job.status === "Interview"
    ).length;
    const offers = jobs.filter(
        job => job.status === "Offer"
    ).length;
    const pending = jobs.filter(
        job => job.status === "Applied"
    ).length;

    document.getElementById("total").textContent = total;
    document.getElementById("interviews").textContent = interviews;
    document.getElementById("offers").textContent = offers;
    document.getElementById("pending").textContent = pending;

    const rate = total ? Math.round(interviews / total * 100) : 0;
    document.getElementById("rate").textContent = rate + "%";
    document.getElementById("progress").style.width = rate + "%";

    let milestone = "Your journey starts here!";
    if (offers > 0) milestone = "Congratulations on your offer!";
    else if (interviews > 0) milestone = "Interview stage reached!";
    else if (total >= 10) milestone = "Great consistency!";

    document.getElementById("milestone").textContent = milestone;

    updateChart();
}

function updateChart() {
    const statuses = ["Applied", "Interview", "Offer", "Rejected"];
    const counts = statuses.map(status =>
        jobs.filter(job => job.status === status).length
    );

    if (typeof Chart === "undefined") return;

    if (statusChart) {
        statusChart.data.datasets[0].data = counts;
        statusChart.update();
        return;
    }

    const canvas = document.getElementById("statusChart");
    if (!canvas) return;

    statusChart = new Chart(canvas, {
        type: "doughnut",
        data: {
            labels: statuses,
            datasets: [{
                data: counts,
                backgroundColor: [
                    "#4f46e5",
                    "#a78bfa",
                    "#22c55e",
                    "#f87171"
                ],
                borderWidth: 0,
                hoverOffset: 5
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: "68%",
            plugins: {
                legend: {
                    position: "bottom",
                    labels: {
                        usePointStyle: true,
                        padding: 18,
                        font: { size: 11 }
                    }
                }
            }
        }
    });
}

document.getElementById("search").addEventListener("input", renderJobs);
document.getElementById("filter").addEventListener("change", renderJobs);

renderJobs();
updateDashboard();
