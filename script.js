
// ===================================
// STUDYTRACK - MAIN JAVASCRIPT
// ===================================

// Get HTML elements
const studyForm = document.getElementById("studyForm");
const studyDate = document.getElementById("studyDate");
const hoursInput = document.getElementById("hours");
const minutesInput = document.getElementById("minutes");
const subjectInput = document.getElementById("subject");

const dailyGoal = document.getElementById("dailyGoal");
const message = document.getElementById("message");

const todayTime = document.getElementById("todayTime");
const totalTime = document.getElementById("totalTime");
const averageTime = document.getElementById("averageTime");
const bestDay = document.getElementById("bestDay");

const historyBody = document.getElementById("historyBody");
const progressBar = document.getElementById("progressBar");
const progressText = document.getElementById("progressText");

// ===================================
// DATE FUNCTIONS
// ===================================

function getLocalDate(date = new Date()) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
}

const today = getLocalDate();

document.getElementById("currentDate").textContent =
    new Date().toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric"
    });

studyDate.value = today;
studyDate.max = today;

// ===================================
// LOAD SAVED DATA
// ===================================

let studyRecords = JSON.parse(
    localStorage.getItem("studyRecords") || "[]"
);

dailyGoal.value = localStorage.getItem("dailyGoal") || 6;

// ===================================
// FORMAT MINUTES INTO HOURS
// ===================================

function formatTime(totalMinutes) {

    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;

    return `${hours}h ${minutes}m`;
}

// ===================================
// SAVE DATA
// ===================================

function saveData() {
    localStorage.setItem(
        "studyRecords",
        JSON.stringify(studyRecords)
    );
}

// ===================================
// ADD STUDY RECORD
// ===================================

studyForm.addEventListener("submit", function(event) {

    event.preventDefault();

    const date = studyDate.value;
    const hours = Number(hoursInput.value);
    const minutes = Number(minutesInput.value);
    const subject = subjectInput.value.trim();

    if (!date || date > today) {
        message.style.color = "#ff6478";
        message.textContent = "Please select a valid date.";
        return;
    }

    if (
        !Number.isInteger(hours) ||
        !Number.isInteger(minutes) ||
        hours < 0 ||
        hours > 24 ||
        minutes < 0 ||
        minutes > 59
    ) {
        message.style.color = "#ff6478";
        message.textContent = "Enter valid study hours and minutes.";
        return;
    }

    const totalMinutes = hours * 60 + minutes;

    if (totalMinutes <= 0 || totalMinutes > 1440) {
        message.style.color = "#ff6478";
        message.textContent = "Study time must be between 1 minute and 24 hours.";
        return;
    }

    // Update an existing date instead of creating duplicates
    const existingRecord = studyRecords.find(
        record => record.date === date
    );

    if (existingRecord) {

        existingRecord.minutes = totalMinutes;
        existingRecord.subject = subject || "General Study";

    } else {

        studyRecords.push({
            date: date,
            minutes: totalMinutes,
            subject: subject || "General Study"
        });

    }

    saveData();

    studyForm.reset();

    studyDate.value = today;

    message.style.color = "#7ee6a1";
    message.textContent = "Study record saved successfully!";

    updateDashboard();

});

// ===================================
// DAILY GOAL
// ===================================

dailyGoal.addEventListener("change", function() {

    const goal = Number(dailyGoal.value);

    if (!Number.isFinite(goal) || goal <= 0 || goal > 24) {
        dailyGoal.value = 6;
    }

    localStorage.setItem("dailyGoal", dailyGoal.value);

    updateDashboard();

});

// ===================================
// UPDATE DASHBOARD
// ===================================

function updateDashboard() {

    const todayRecord = studyRecords.find(
        record => record.date === today
    );

    const todayMinutes = todayRecord
        ? todayRecord.minutes
        : 0;

    // Today's study time
    todayTime.textContent = formatTime(todayMinutes);

    // Total study time
    const totalMinutes = studyRecords.reduce(
        (sum, record) => sum + record.minutes,
        0
    );

    totalTime.textContent = formatTime(totalMinutes);

    // Daily average
    const average = studyRecords.length > 0
        ? Math.round(totalMinutes / studyRecords.length)
        : 0;

    averageTime.textContent = formatTime(average);

    // Best study day
    const highest = studyRecords.length > 0
        ? Math.max(...studyRecords.map(record => record.minutes))
        : 0;

    bestDay.textContent = formatTime(highest);

    // Progress bar
    const goalMinutes = Number(dailyGoal.value) * 60;

    const percentage = goalMinutes > 0
        ? (todayMinutes / goalMinutes) * 100
        : 0;

    progressBar.style.width =
        Math.min(percentage, 100) + "%";

    progressText.textContent =
        `${Math.round(percentage)}% completed (${formatTime(todayMinutes)} / ${formatTime(goalMinutes)})`;

    // Update other sections
    displayHistory();
    updateChart();
}

// ===================================
// DISPLAY STUDY HISTORY
// ===================================

function displayHistory() {

    historyBody.innerHTML = "";

    const sortedRecords = [...studyRecords].sort(
        (a, b) => b.date.localeCompare(a.date)
    );

    if (sortedRecords.length === 0) {

        historyBody.innerHTML = `
            <tr>
                <td colspan="4">No study records yet.</td>
            </tr>
        `;

        return;
    }

    sortedRecords.forEach(record => {

        const row = document.createElement("tr");

        const dateCell = document.createElement("td");
        const timeCell = document.createElement("td");
        const subjectCell = document.createElement("td");
        const actionCell = document.createElement("td");

        dateCell.textContent = record.date;
        timeCell.textContent = formatTime(record.minutes);
        subjectCell.textContent = record.subject;

        const deleteButton = document.createElement("button");

        deleteButton.textContent = "Delete";
        deleteButton.className = "delete-btn";

        deleteButton.addEventListener("click", function() {

            studyRecords = studyRecords.filter(
                item => item.date !== record.date
            );

            saveData();
            updateDashboard();

        });

        actionCell.appendChild(deleteButton);

        row.append(
            dateCell,
            timeCell,
            subjectCell,
            actionCell
        );

        historyBody.appendChild(row);

    });
}

// ===================================
// STUDY GROWTH GRAPH
// ===================================

let studyChart;

function updateChart() {

    const labels = [];
    const values = [];

    // Last 7 days including today
    for (let i = 6; i >= 0; i--) {

        const date = new Date();

        date.setDate(date.getDate() - i);

        const dateString = getLocalDate(date);

        labels.push(
            date.toLocaleDateString("en-IN", {
                day: "numeric",
                month: "short"
            })
        );

        const record = studyRecords.find(
            item => item.date === dateString
        );

        values.push(
            record ? record.minutes / 60 : 0
        );

    }

    if (studyChart) {
        studyChart.destroy();
    }

    const ctx = document
        .getElementById("studyChart")
        .getContext("2d");

    studyChart = new Chart(ctx, {

        type: "line",

        data: {

            labels: labels,

            datasets: [{

                label: "Study Hours",

                data: values,

                borderColor: "#8b9cff",

                backgroundColor: "rgba(139,156,255,0.15)",

                borderWidth: 3,

                fill: true,

                tension: 0.4,

                pointRadius: 5,

                pointBackgroundColor: "#55dfba"

            }]

        },

        options: {

            responsive: true,

            maintainAspectRatio: false,

            plugins: {

                legend: {
                    labels: {
                        color: "#ffffff"
                    }
                }

            },

            scales: {

                y: {

                    beginAtZero: true,

                    title: {
                        display: true,
                        text: "Hours Studied",
                        color: "#ffffff"
                    },

                    ticks: {
                        color: "#aab3ce"
                    },

                    grid: {
                        color: "#303956"
                    }

                },

                x: {

                    ticks: {
                        color: "#aab3ce"
                    },

                    grid: {
                        color: "#303956"
                    }

                }

            }

        }

    });

}

// ===================================
// START APPLICATION
// ===================================

updateDashboard();
