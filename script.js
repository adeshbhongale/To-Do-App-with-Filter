// DOM Element References
const newTaskInput = document.getElementById('newTaskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');
const messageBox = document.getElementById('message-box');

// Filter Buttons
const filterAllBtn = document.getElementById('filterAllBtn');
const filterActiveBtn = document.getElementById('filterActiveBtn'); // Corrected
const filterCompletedBtn = document.getElementById('filterCompletedBtn');

// Task Statistics
const activeTasksCount = document.getElementById('activeTasksCount');
const completedTasksCount = document.getElementById('completedTasksCount'); // Corrected: Used getElementById

// Confirmation Modal Elements
const confirmationModal = document.getElementById('confirmationModal');
const modalTitle = document.getElementById('modalTitle');
const modalMessage = document.getElementById('modalMessage');
const confirmBtn = document.getElementById('confirmBtn');
const cancelBtn = document.getElementById('cancelBtn');
const clearCompletedBtn = document.getElementById('clearCompletedBtn');

// Global array to store tasks and their data, including time tracking
let tasks = [];
let currentFilter = 'all'; // Stores the currently active filter ('all', 'active', 'completed')

/**
 * Displays a temporary message to the user.
 * @param {string} message - The message text to display.
 * @param {string} [type='info'] - The type of message ('success', 'error', 'info').
 */
function showMessage(message, type = 'info') {
    messageBox.textContent = message;
    messageBox.className = 'hidden bg-[#d4edda]/90 backdrop-blur-sm text-[#155724] p-3 rounded-lg text-center text-sm border border-[#c3e6cb] shadow-lg opacity-0 -translate-y-2.5 transition-all duration-300'; // Reset classes

    // Apply type-specific styling
    if (type === 'error') {
        messageBox.classList.add('bg-red-200/90', 'text-red-800', 'border-red-300');
    } else if (type === 'success') {
        messageBox.classList.add('bg-[#d4edda]/90', 'text-[#155724]', 'border-[#c3e6cb]');
    } else { // info
        messageBox.classList.add('bg-yellow-200/90', 'text-yellow-800', 'border-yellow-300');
    }

    // Trigger reflow to restart CSS transition
    void messageBox.offsetWidth;
    messageBox.classList.remove('hidden', 'opacity-0', '-translate-y-2.5'); // Show and reset animation
    messageBox.classList.add('opacity-100', 'translate-y-0');

    // Hide message after 3 seconds
    setTimeout(() => {
        messageBox.classList.remove('opacity-100', 'translate-y-0');
        messageBox.classList.add('opacity-0', '-translate-y-2.5');
        setTimeout(() => messageBox.classList.add('hidden'), 300); // Hide after transition
    }, 3000);
}

/**
 * Displays a confirmation modal to the user.
 * @param {string} title - The title of the confirmation modal.
 * @param {string} message - The message/question to display in the modal.
 * @param {function} onConfirm - Callback function to execute if the user confirms.
 */
function showConfirmationModal(title, message, onConfirm) {
    modalTitle.textContent = title;
    modalMessage.textContent = message;
    confirmationModal.classList.remove('opacity-0', 'invisible');
    confirmationModal.classList.add('opacity-100', 'visible');
    // For the modal content animation
    confirmationModal.querySelector('.modal-content').classList.remove('-translate-y-5');
    confirmationModal.querySelector('.modal-content').classList.add('translate-y-0');


    // Clear previous event listeners to prevent multiple calls if modal is reused
    confirmBtn.onclick = null;
    cancelBtn.onclick = null;

    // Attach new event listeners for confirm and cancel actions
    confirmBtn.onclick = () => {
        onConfirm(); // Execute the provided callback
        hideConfirmationModal(); // Hide the modal
    };
    cancelBtn.onclick = () => hideConfirmationModal(); // Just hide the modal
}

/**
 * Hides the confirmation modal.
 */
function hideConfirmationModal() {
    confirmationModal.classList.remove('opacity-100', 'visible');
    confirmationModal.classList.add('opacity-0', 'invisible');
    // For the modal content animation
    confirmationModal.querySelector('.modal-content').classList.remove('translate-y-0');
    confirmationModal.querySelector('.modal-content').classList.add('-translate-y-5');
}

/**
 * Converts milliseconds duration into a human-readable string (e.g., "1h 30m 5s").
 * @param {number} ms - Duration in milliseconds.
 * @returns {string} Formatted duration string.
 */
function formatDuration(ms) {
    if (ms === null || isNaN(ms) || ms < 0) return ''; // Handle null, NaN, or negative durations

    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    let parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours % 24 > 0) parts.push(`${hours % 24}h`);
    if (minutes % 60 > 0) parts.push(`${minutes % 60}m`);
    // Only show seconds if no other unit or if it's the only unit
    if ((seconds % 60 > 0 || parts.length === 0) && ms > 0) parts.push(`${seconds % 60}s`);

    return parts.join(' ');
}

/**
 * Updates the counts of active and completed tasks displayed in the UI.
 */
function updateTaskStats() {
    const activeCount = tasks.filter(task => !task.completed).length;
    const completedCount = tasks.filter(task => task.completed).length;

    activeTasksCount.textContent = activeCount;
    completedTasksCount.textContent = completedCount;
}

/**
 * Loads tasks from Local Storage and renders them to the DOM.
 * Also applies the current filter and updates task statistics.
 */
function loadTasks() {
    // Attempt to retrieve tasks from local storage.
    // If 'todos' key exists, parse its JSON string value into the tasks array.
    // If not, initialize tasks as an empty array.
    tasks = JSON.parse(localStorage.getItem('todos')) || [];

    taskList.innerHTML = ''; // Clear existing tasks in the DOM
    tasks.forEach(task => addTaskToDOM(task, false)); // Pass full task object
    filterTasks(currentFilter); // Apply current filter after loading
    updateTaskStats(); // Update stats on load
}

/**
 * Saves the current tasks array to Local Storage.
 */
function saveTasks() {
    // Convert the 'tasks' array into a JSON string and store it in local storage
    // under the key 'todos'.
    localStorage.setItem('todos', JSON.stringify(tasks));
    updateTaskStats(); // Update stats after saving
}

/**
 * Creates and adds a new task item to the DOM.
 * @param {object} taskObject - The task object containing id, text, completed, creationTime, completionTime, durationMs.
 * @param {boolean} [animate=false] - Whether to apply an entry animation.
 */
function addTaskToDOM(taskObject, animate = false) {
    const listItem = document.createElement('li');
    // Ensure task-item class is added for filtering to work correctly
    listItem.className = `task-item flex items-center justify-between p-4 bg-white/90 backdrop-blur-sm rounded-lg shadow-lg border border-white/20 transition-all duration-300 ${taskObject.completed ? 'opacity-70 line-through text-gray-500 bg-green-50/90' : ''}`;
    listItem.dataset.id = taskObject.id; // Store task ID on the DOM element

    // Container for checkbox and task text
    const checkboxTextContainer = document.createElement('div');
    checkboxTextContainer.className = 'flex items-center flex-grow gap-3';

    // Custom Checkbox Structure
    const checkboxLabel = document.createElement('label');
    checkboxLabel.className = 'relative flex items-center justify-center w-6 h-6 border-2 border-[#7fd253] rounded-md cursor-pointer flex-shrink-0';
    const checkboxInput = document.createElement('input');
    checkboxInput.type = 'checkbox';
    checkboxInput.checked = taskObject.completed;
    checkboxInput.className = 'absolute opacity-0 w-full h-full cursor-pointer z-10'; // Make input fully clickable
    const checkmarkSpan = document.createElement('span');
    checkmarkSpan.className = 'absolute top-0 left-0 w-full h-full bg-white rounded-md transition-colors duration-200 flex items-center justify-center';
    const checkIcon = document.createElement('i'); // Corrected: Used createElement for new element
    checkIcon.className = 'fas fa-check text-white text-xs opacity-0 transition-opacity duration-200';

    if (taskObject.completed) {
        checkmarkSpan.classList.add('bg-[#7fd253]', 'border-[#7fd253]');
        checkIcon.classList.add('opacity-100');
    }

    checkmarkSpan.appendChild(checkIcon);
    checkboxLabel.appendChild(checkboxInput);
    checkboxLabel.appendChild(checkmarkSpan);

    // Task Text Span
    const taskSpan = document.createElement('span');
    taskSpan.className = 'task-text text-[#333333] flex-grow cursor-pointer text-lg font-medium';
    taskSpan.textContent = taskObject.text;

    // Task Duration Display (New element)
    const durationSpan = document.createElement('span');
    durationSpan.className = 'task-duration text-gray-500 text-xs ml-auto whitespace-nowrap'; // Added whitespace-nowrap
    if (taskObject.completed && taskObject.durationMs !== null) {
        durationSpan.textContent = ` (${formatDuration(taskObject.durationMs)})`;
    } else {
        durationSpan.textContent = ''; // Empty for incomplete tasks
    }

    checkboxTextContainer.appendChild(checkboxLabel);
    checkboxTextContainer.appendChild(taskSpan);
    checkboxTextContainer.appendChild(durationSpan);

    // Action Buttons Container (Edit & Delete re-enabled)
    const taskActions = document.createElement('div');
    taskActions.className = 'flex gap-2';

    // Edit Button with Font Awesome Icon
    const editBtn = document.createElement('button');
    editBtn.className = 'action-btn edit-btn text-gray-500 hover:text-blue-600 transition-colors text-lg p-2 rounded-full hover:bg-gray-100';
    editBtn.innerHTML = '<i class="fas fa-edit"></i>';

    // Delete Button with Font Awesome Icon
    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'action-btn delete-btn text-gray-500 hover:text-red-600 transition-colors text-lg p-2 rounded-full hover:bg-gray-100';
    deleteBtn.innerHTML = '<i class="fas fa-trash-alt"></i>';

    taskActions.appendChild(editBtn);
    taskActions.appendChild(deleteBtn);

    // Append main elements to the list item
    listItem.appendChild(checkboxTextContainer);
    listItem.appendChild(taskActions);
    taskList.appendChild(listItem);

    // Apply entry animation if requested
    if (animate) {
        listItem.classList.add('opacity-0', 'scale-95');
        setTimeout(() => {
            listItem.classList.remove('opacity-0', 'scale-95');
            listItem.classList.add('opacity-100', 'scale-100');
        }, 50); // Small delay to ensure transition is applied
    }

    // --- Event Listeners for the new task item ---

    // Toggle task completion
    checkboxInput.addEventListener('change', () => {
        const taskId = listItem.dataset.id;
        const taskIndex = tasks.findIndex(t => t.id === taskId);
        if (taskIndex > -1) {
            const task = tasks[taskIndex];
            task.completed = checkboxInput.checked;

            if (task.completed) {
                listItem.classList.add('opacity-70', 'line-through', 'text-gray-500', 'bg-green-50/90');
                checkmarkSpan.classList.add('bg-[#7fd253]', 'border-[#7fd253]');
                checkIcon.classList.add('opacity-100');
                task.completionTime = Date.now();
                task.durationMs = task.completionTime - task.creationTime;
                durationSpan.textContent = ` (${formatDuration(task.durationMs)})`;
                showMessage('Task completed!', 'success');
            } else {
                listItem.classList.remove('opacity-70', 'line-through', 'text-gray-500', 'bg-green-50/90');
                checkmarkSpan.classList.remove('bg-[#7fd253]', 'border-[#7fd253]');
                checkIcon.classList.remove('opacity-100');
                // If uncompleted, reset completion data and restart creation time
                task.creationTime = Date.now(); // Start counting from now again
                task.completionTime = null;
                task.durationMs = null;
                durationSpan.textContent = '';
                showMessage('Task marked active!', 'info');
            }
            saveTasks(); // <--- This function saves the updated tasks array to local storage
            filterTasks(currentFilter); // Re-apply filter to update visibility
        }
    });

    // Delete task button click
    deleteBtn.addEventListener('click', () => {
        showConfirmationModal('Delete Task', 'Are you sure you want to delete this task?', () => {
            const taskIdToDelete = listItem.dataset.id;
            // Apply leaving animation
            listItem.classList.add('opacity-0', 'scale-95'); // Tailwind classes for leaving animation
            // Remove item from DOM after animation completes
            listItem.addEventListener('transitionend', () => {
                listItem.remove();
                tasks = tasks.filter(t => t.id !== taskIdToDelete); // Remove from global array
                saveTasks(); // <--- This function saves the updated tasks array to local storage
                showMessage('Task deleted successfully!', 'success');
                filterTasks(currentFilter); // Re-apply filter
            }, { once: true });
        });
    });

    /**
     * Initiates the editing process for a task.
     * Replaces the task text with an input field.
     */
    const startEditing = () => {
        // Prevent editing if task is already completed
        if (taskObject.completed) {
            showMessage('Cannot edit a completed task. Please uncheck it first.', 'info');
            return;
        }

        const currentText = taskSpan.textContent;
        const editInput = document.createElement('input');
        editInput.type = 'text';
        editInput.value = currentText;
        // Apply Tailwind classes for basic styling of the edit input
        editInput.className = 'flex-grow p-1 border border-blue-300 rounded focus:border-blue-500 focus:ring-blue-500 text-[#333333]';

        // Replace the static task text span with the editable input field
        checkboxTextContainer.replaceChild(editInput, taskSpan);
        editInput.focus(); // Focus the input for immediate editing

        /**
         * Saves the edited task text.
         * Reverts the input field back to a text span.
         */
        const saveEdit = () => {
            const newText = editInput.value.trim();
            if (newText && newText !== currentText) { // If text is not empty and has changed
                taskSpan.textContent = newText;
                checkboxTextContainer.replaceChild(taskSpan, editInput); // Replace input with span
                // Update the task in the global tasks array
                const taskId = listItem.dataset.id;
                const taskIndex = tasks.findIndex(t => t.id === taskId);
                if (taskIndex > -1) {
                    tasks[taskIndex].text = newText;
                    saveTasks(); // <--- This function saves the updated tasks array to local storage
                }
                showMessage('Task updated successfully!', 'success');
            } else if (!newText) { // If new text is empty
                showMessage('Task cannot be empty!', 'error');
                taskSpan.textContent = currentText; // Revert to original text
                checkboxTextContainer.replaceChild(taskSpan, editInput);
            } else { // No change or text is same as original
                checkboxTextContainer.replaceChild(taskSpan, editInput); // Just revert to span
            }
        };

        // Save on blur (when input loses focus)
        editInput.addEventListener('blur', saveEdit);
        // Save on Enter key press
        editInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                saveEdit();
                editInput.blur(); // Manually trigger blur to ensure saveEdit logic runs and input loses focus
            }
        });
    };

    // Attach event listeners to start editing
    taskSpan.addEventListener('click', startEditing); // Click on text
    editBtn.addEventListener('click', startEditing); // Click on edit icon

    filterTasks(currentFilter); // Ensure the new task respects the current filter
}

/**
 * Filters the displayed tasks based on their completion status.
 * Updates the active filter button style.
 * @param {string} filterType - The type of filter ('all', 'active', 'completed').
 */
function filterTasks(filterType) {
    currentFilter = filterType; // Update global filter state

    // Remove 'active' class from all filter buttons and apply default styles
    filterAllBtn.classList.remove('active', 'bg-[#4f963a]', 'text-white', 'border-[#4f963a]', 'hover:bg-[#4f963a]');
    filterAllBtn.classList.add('bg-white/90', 'text-[#333333]', 'border-white/20');

    filterActiveBtn.classList.remove('active', 'bg-[#4f963a]', 'text-white', 'border-[#4f963a]', 'hover:bg-[#4f963a]');
    filterActiveBtn.classList.add('bg-white/90', 'text-[#333333]', 'border-white/20');

    filterCompletedBtn.classList.remove('active', 'bg-[#4f963a]', 'text-white', 'border-[#4f963a]', 'hover:bg-[#4f963a]');
    filterCompletedBtn.classList.add('bg-white/90', 'text-[#333333]', 'border-white/20');


    // Add 'active' class to the currently selected filter button
    if (filterType === 'all') {
        filterAllBtn.classList.add('active', 'bg-[#4f963a]', 'text-white', 'border-[#4f963a]', 'hover:bg-[#4f963a]');
    } else if (filterType === 'active') {
        filterActiveBtn.classList.add('active', 'bg-[#4f963a]', 'text-white', 'border-[#4f963a]', 'hover:bg-[#4f963a]');
    } else if (filterType === 'completed') {
        filterCompletedBtn.classList.add('active', 'bg-[#4f963a]', 'text-white', 'border-[#4f963a]', 'hover:bg-[#4f963a]');
    }

    // Iterate through all tasks and toggle their display based on the filter
    document.querySelectorAll('.task-item').forEach(item => {
        // Determine completion status based on the task object (more reliable)
        const taskId = item.dataset.id;
        const task = tasks.find(t => t.id === taskId);
        const isCompleted = task ? task.completed : false;

        if (filterType === 'all') {
            item.style.display = 'flex'; // Show all tasks
        } else if (filterType === 'active') {
            item.style.display = isCompleted ? 'none' : 'flex'; // Show only incomplete tasks
        } else if (filterType === 'completed') {
            item.style.display = isCompleted ? 'flex' : 'none'; // Show only completed tasks
        }
    });
}

// --- Global Event Listeners ---

// Add Task button click
addTaskBtn.addEventListener('click', () => {
    const taskText = newTaskInput.value.trim();
    if (taskText) {
        const newTaskId = Date.now().toString() + Math.random().toString(36).substring(2, 9); // Simple unique ID
        const newTaskObject = {
            id: newTaskId,
            text: taskText,
            completed: false,
            creationTime: Date.now(), // Record creation time
            completionTime: null,
            durationMs: null
        };
        tasks.push(newTaskObject); // Add to global tasks array
        addTaskToDOM(newTaskObject, true); // Pass object to DOM function with animation
        saveTasks(); // <--- This function saves the updated tasks array to local storage
        newTaskInput.value = ''; // Clear input field
        showMessage('Task added successfully!', 'success');
    } else {
        showMessage('Task cannot be empty!', 'error');
    }
});

// Allow adding task with Enter key press in the input field
newTaskInput.addEventListener('keypress', (event) => {
    if (event.key === 'Enter') {
        addTaskBtn.click(); // Simulate a click on the add button
    }
});

// Filter button event listeners
filterAllBtn.addEventListener('click', () => filterTasks('all'));
filterActiveBtn.addEventListener('click', () => filterTasks('active'));
filterCompletedBtn.addEventListener('click', () => filterTasks('completed'));

// Clear Completed Tasks button click
clearCompletedBtn.addEventListener('click', () => {
    // Get tasks from the 'tasks' array that are completed and visible under current filter
    const completedTasksInView = tasks.filter(t => t.completed && (currentFilter === 'all' || currentFilter === 'completed'));

    if (completedTasksInView.length === 0) {
        showMessage('No completed tasks to clear.', 'info');
        return;
    }

    showConfirmationModal('Clear Completed Tasks', 'Are you sure you want to clear all completed tasks?', () => {
        // Collect the actual DOM elements that are completed
        const completedTaskElements = Array.from(taskList.querySelectorAll('.task-item.line-through'));

        if (completedTaskElements.length === 0) { // Double check in case of filter
            // If no elements with line-through are found, just clear from data
            tasks = tasks.filter(t => !t.completed);
            saveTasks(); // <--- This function saves the updated tasks array to local storage
            showMessage('Completed tasks cleared!', 'success');
            filterTasks(currentFilter);
            return;
        }

        let animationsCompleted = 0;
        completedTaskElements.forEach(taskElement => {
            taskElement.classList.add('opacity-0', 'scale-95'); // Apply leaving animation
            taskElement.addEventListener('transitionend', () => {
                taskElement.remove();
                animationsCompleted++;
                if (animationsCompleted === completedTaskElements.length) {
                    tasks = tasks.filter(t => !t.completed);
                    saveTasks(); // <--- This function saves the updated tasks array to local storage
                    showMessage('Completed tasks cleared!', 'success');
                    filterTasks(currentFilter); // Re-apply filter to update view if needed
                }
            }, { once: true });
        });
    });
});

// Update dynamic time and date display
function updateDateTime() {
    const timeElement = document.getElementById('currentTime');
    const dateElement = document.getElementById('currentDate');

    const now = new Date();

    const time = now.toLocaleTimeString('en-US', {
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
    });

    const date = now.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });

    if (timeElement) timeElement.textContent = time;
    if (dateElement) dateElement.textContent = date;
}

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    loadTasks(); // <--- This function loads tasks from local storage when the page starts
    updateDateTime();
    setInterval(updateDateTime, 1000); // Keep date/time updated
});