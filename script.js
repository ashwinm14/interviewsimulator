document.addEventListener('DOMContentLoaded', () => {

    /* --- Data Mocks --- */
    const testDatabase = {
        'aptitude': {
            title: "Aptitude & Logical Reasoning",
            duration: 30 * 60, // 30 minutes in seconds
            questions: [
                { id: 1, text: "A train running at the speed of 60 km/hr crosses a pole in 9 seconds. What is the length of the train?", options: ["120 metres", "180 metres", "324 metres", "150 metres"], correct: 3 },
                { id: 2, text: "Find the odd one out: 3, 5, 11, 14, 17, 21", options: ["21", "17", "14", "3"], correct: 2 },
                { id: 3, text: "If A is the brother of B; B is the sister of C; and C is the father of D, how D is related to A?", options: ["Brother", "Sister", "Nephew", "Cannot be determined"], correct: 3 },
                { id: 4, text: "The sum of ages of 5 children born at the intervals of 3 years each is 50 years. What is the age of the youngest child?", options: ["4 years", "8 years", "10 years", "None of these"], correct: 0 },
                { id: 5, text: "A can do a work in 15 days and B in 20 days. If they work on it together for 4 days, then the fraction of the work that is left is:", options: ["1/4", "1/10", "7/15", "8/15"], correct: 3 }
            ]
        },
        'corecs': {
            title: "Core CS Fundamentals",
            duration: 45 * 60,
            questions: [
                { id: 1, text: "Which page replacement algorithm suffers from Belady's Anomaly?", options: ["LRU", "FIFO", "Optimal", "LFU"], correct: 1 },
                { id: 2, text: "In the OSI model, which layer maps directly to the TCP/IP model's Internet layer?", options: ["Data Link Layer", "Network Layer", "Transport Layer", "Session Layer"], correct: 1 },
                { id: 3, text: "Which normal form deals with multivalued dependencies?", options: ["2NF", "3NF", "BCNF", "4NF"], correct: 3 },
                { id: 4, text: "What is a deadlock?", options: ["Two threads executing concurrently", "Two or more processes waiting indefinitely for an event that can be caused by only one of the waiting processes", "A system crash", "Memory leak"], correct: 1 },
                { id: 5, text: "Which protocol is used to map IP addresses to MAC addresses?", options: ["DNS", "DHCP", "ARP", "ICMP"], correct: 2 }
            ]
        },
        'dsa': {
            title: "DSA & Coding MCQs",
            duration: 60 * 60,
            questions: [
                { id: 1, text: "What is the worst-case time complexity of QuickSort?", options: ["O(n log n)", "O(n)", "O(n^2)", "O(log n)"], correct: 2 },
                { id: 2, text: "Which data structure is used to implement BFS routing algorithms?", options: ["Stack", "Queue", "Tree", "Graph"], correct: 1 },
                { id: 3, text: "What will be the output of the following pseudocode?", code: "function solve(n):\n  if n == 0 return 0\n  return solve(n-1) + n", options: ["Factorial of n", "Sum of first n natural numbers", "n^2", "Infinite Loop"], correct: 1 },
                { id: 4, text: "Which of the following sorting algorithms is NOT stable by default?", options: ["Merge Sort", "Insertion Sort", "Bubble Sort", "Quick Sort"], correct: 3 },
                { id: 5, text: "In a binary search tree (BST), which traversal yields items in sorted ascending order?", options: ["Pre-order", "In-order", "Post-order", "Level-order"], correct: 1 }
            ]
        }
    };

    /* --- State --- */
    let currentTestId = null;
    let questionsData = [];
    let state = []; // Array of objects mapping to each question: { status: 'notvisited' | 'unanswered' | 'answered' | 'review', selectedOption: -1 }
    let currIndex = 0;
    let timerInterval = null;
    let secondsLeft = 0;
    const MARKS_CORRECT = 1;
    const MARKS_WRONG = -0.25;

    /* --- DOM Elements --- */
    const views = {
        dashboard: document.getElementById('dashboard-view'),
        test: document.getElementById('test-view'),
        result: document.getElementById('result-view')
    };

    const ui = {
        timerDisplay: document.getElementById('time-left'),
        testTitle: document.getElementById('active-test-title'),
        qNum: document.getElementById('q-num-label'),
        qText: document.getElementById('q-text'),
        qCodeContainer: document.getElementById('q-code-container'),
        qCode: document.getElementById('q-code'),
        qOptions: document.getElementById('q-options-container'),
        palette: document.getElementById('q-palette'),
        
        btnPrev: document.getElementById('btn-prev'),
        btnSave: document.getElementById('btn-save'),
        btnClear: document.getElementById('btn-clear'),
        btnReview: document.getElementById('btn-review'),
        btnSubmit: document.getElementById('btn-submit-test'),
        btnHome: document.getElementById('btn-home'),

        // Stats
        cAnswered: document.getElementById('count-answered'),
        cUnanswered: document.getElementById('count-unanswered'),
        cNotvisited: document.getElementById('count-notvisited'),
        cReview: document.getElementById('count-review')
    };

    /* --- View Navigation --- */
    function showView(viewName) {
        Object.values(views).forEach(v => v.classList.remove('active'));
        views[viewName].classList.add('active');
        if (viewName === 'test') {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
    }

    /* --- Core Test Logic --- */
    function initializeTest(testId) {
        currentTestId = testId;
        const testObj = testDatabase[testId];
        questionsData = testObj.questions;
        secondsLeft = testObj.duration;
        ui.testTitle.textContent = testObj.title;

        // Init State
        state = questionsData.map(() => ({
            status: 'notvisited',
            selectedOption: -1
        }));
        
        // First question visited
        currIndex = 0;
        state[0].status = 'unanswered';

        renderPalette();
        loadQuestion(0);
        updateStats();

        // Start Timer
        clearInterval(timerInterval);
        ui.timerDisplay.textContent = formatTime(secondsLeft);
        timerInterval = setInterval(() => {
            if (secondsLeft > 0) {
                secondsLeft--;
                ui.timerDisplay.textContent = formatTime(secondsLeft);
            } else {
                submitTest("Time's Up!");
            }
        }, 1000);

        showView('test');
    }

    function formatTime(sec) {
        const h = Math.floor(sec / 3600);
        const m = Math.floor((sec % 3600) / 60);
        const s = sec % 60;
        return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    function loadQuestion(index) {
        currIndex = index;
        const q = questionsData[index];
        const s = state[index];

        ui.qNum.textContent = `Question ${index + 1}`;
        ui.qText.textContent = q.text;

        if (q.code) {
            ui.qCodeContainer.classList.remove('hidden');
            ui.qCode.textContent = q.code;
        } else {
            ui.qCodeContainer.classList.add('hidden');
        }

        ui.qOptions.innerHTML = '';
        q.options.forEach((opt, i) => {
            const div = document.createElement('div');
            div.className = `option-box ${s.selectedOption === i ? 'selected' : ''}`;
            div.innerHTML = `
                <input type="radio" name="mock-option" id="opt-${i}" value="${i}" ${s.selectedOption === i ? 'checked' : ''}>
                <label for="opt-${i}">${opt}</label>
            `;
            
            // Allow clicking entire box
            div.addEventListener('click', () => {
                document.querySelectorAll('.option-box').forEach(b => b.classList.remove('selected'));
                div.classList.add('selected');
                div.querySelector('input').checked = true;
                s.selectedOption = i;
            });
            ui.qOptions.appendChild(div);
        });

        // Update Palette Active Class
        document.querySelectorAll('.palette-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i === index);
        });

        // Prev logic
        ui.btnPrev.style.visibility = index === 0 ? 'hidden' : 'visible';
        
        // Next/Submit Logic
        if (index === questionsData.length - 1) {
            ui.btnSave.innerHTML = `Save & Submit <i class="fa-solid fa-check"></i>`;
        } else {
            ui.btnSave.innerHTML = `Save & Next <i class="fa-solid fa-angle-right"></i>`;
        }
    }

    function renderPalette() {
        ui.palette.innerHTML = '';
        state.forEach((s, i) => {
            const btn = document.createElement('button');
            btn.className = `palette-btn q-pal-${s.status}`;
            btn.textContent = i + 1;
            btn.addEventListener('click', () => navigateTo(i));
            ui.palette.appendChild(btn);
        });
    }

    function updatePaletteColor(index) {
        const btn = ui.palette.children[index];
        btn.className = `palette-btn q-pal-${state[index].status}`;
        if (index === currIndex) btn.classList.add('active');
        updateStats();
    }

    function updateStats() {
        const counts = { answered: 0, unanswered: 0, notvisited: 0, review: 0 };
        state.forEach(s => counts[s.status]++);
        
        ui.cAnswered.textContent = counts.answered;
        ui.cUnanswered.textContent = counts.unanswered;
        ui.cNotvisited.textContent = counts.notvisited;
        ui.cReview.textContent = counts.review;
    }

    function navigateTo(index) {
        // Evaluate current status before leaving
        const s = state[currIndex];
        if (s.status === 'notvisited') {
            s.status = 'unanswered';
        }
        updatePaletteColor(currIndex);

        // Move to new
        if (state[index].status === 'notvisited') {
            state[index].status = 'unanswered';
        }
        loadQuestion(index);
        updatePaletteColor(index);
    }

    function saveAndNext() {
        const s = state[currIndex];
        if (s.selectedOption !== -1) {
            s.status = 'answered';
        } else {
            s.status = 'unanswered';
        }
        updatePaletteColor(currIndex);

        if (currIndex < questionsData.length - 1) {
            navigateTo(currIndex + 1);
        } else {
            // Reached last, prompt submit
            ui.btnSubmit.click();
        }
    }

    function markReviewAndNext() {
        const s = state[currIndex];
        s.status = 'review'; // Doesn't matter if answered or not, it goes purple for review
        updatePaletteColor(currIndex);
        
        if (currIndex < questionsData.length - 1) {
            navigateTo(currIndex + 1);
        }
    }

    function clearResponse() {
        state[currIndex].selectedOption = -1;
        state[currIndex].status = 'unanswered';
        loadQuestion(currIndex); // Re-render radio buttons
        updatePaletteColor(currIndex);
    }

    function submitTest(reason = "") {
        if(reason || confirm("Are you sure you want to submit the test? You cannot change answers after this.")) {
            clearInterval(timerInterval);
            calculateResults();
            showView('result');
        }
    }

    function calculateResults() {
        let correct = 0;
        let wrong = 0;
        let attempted = 0;

        state.forEach((s, i) => {
            if (s.selectedOption !== -1) {
                attempted++;
                if (s.selectedOption === questionsData[i].correct) {
                    correct++;
                } else {
                    wrong++;
                }
            }
        });

        const score = (correct * MARKS_CORRECT) + (wrong * MARKS_WRONG);
        const maxScore = questionsData.length * MARKS_CORRECT;
        const accuracy = attempted === 0 ? 0 : Math.round((correct / attempted) * 100);

        document.getElementById('result-score').textContent = `${score} / ${maxScore}`;
        document.getElementById('res-attempted').textContent = attempted;
        document.getElementById('res-correct').textContent = correct;
        document.getElementById('res-wrong').textContent = wrong;
        document.getElementById('res-accuracy').textContent = `${accuracy}%`;
    }

    /* --- Event Listeners --- */
    document.querySelectorAll('.start-test-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const testId = e.target.dataset.testid;
            if (confirm("You are about to start a timed mock test. Make sure you are in a distraction-free environment. Proceed?")) {
                initializeTest(testId);
            }
        });
    });

    ui.btnSave.addEventListener('click', saveAndNext);
    ui.btnReview.addEventListener('click', markReviewAndNext);
    ui.btnClear.addEventListener('click', clearResponse);
    ui.btnPrev.addEventListener('click', () => { if(currIndex > 0) navigateTo(currIndex - 1); });
    ui.btnSubmit.addEventListener('click', () => submitTest());
    ui.btnHome.addEventListener('click', () => showView('dashboard'));

    // Theme logic
    const themeBtn = document.getElementById('theme-toggle');
    themeBtn.addEventListener('click', () => {
        document.body.classList.toggle('light-theme');
        const isLight = document.body.classList.contains('light-theme');
        themeBtn.innerHTML = isLight ? '<i class="fa-solid fa-moon"></i>' : '<i class="fa-solid fa-sun"></i>';
    });

});
