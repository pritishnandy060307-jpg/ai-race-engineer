// Reusable UI building blocks for the Race Engineer application.

export function createSection({ id, ariaLabel, title, description = "" }) {
    const section = document.createElement("section");
    section.id = id;
    section.className = "calculator-section";
    if (ariaLabel) section.setAttribute("aria-label", ariaLabel);

    const heading = document.createElement("h2");
    heading.textContent = title;
    section.appendChild(heading);

    if (description) {
        const text = document.createElement("p");
        text.className = "calculator-description";
        text.textContent = description;
        section.appendChild(text);
    }

    return section;
}

export function createField({ id, label, type = "number", value = "", min, max, step }) {
    const wrapper = document.createElement("label");
    wrapper.textContent = label;

    const input = document.createElement("input");
    input.id = id;
    input.type = type;
    if (value !== "") input.value = value;
    if (min !== undefined) input.min = min;
    if (max !== undefined) input.max = max;
    if (step !== undefined) input.step = step;

    wrapper.appendChild(input);
    return wrapper;
}

export function createCalculatorGrid(fields = []) {
    const grid = document.createElement("div");
    grid.className = "calculator-grid";
    fields.forEach(field => grid.appendChild(createField(field)));
    return grid;
}

export function createResultCard(label, id) {
    const card = document.createElement("div");
    card.className = "result-card";

    const labelElement = document.createElement("span");
    labelElement.textContent = label;

    const valueElement = document.createElement("strong");
    valueElement.id = id;
    valueElement.textContent = "—";

    card.append(labelElement, valueElement);
    return card;
}

export function createResultsGrid(results = []) {
    const grid = document.createElement("div");
    grid.className = "calculator-results";
    if (results.length === 3) grid.classList.add("calculator-results-3");
    if (results.length === 4) grid.classList.add("calculator-results-4");
    if (results.length >= 6) grid.classList.add("calculator-results-6");
    results.forEach(result => grid.appendChild(createResultCard(result.label, result.id)));
    return grid;
}

export function createErrorMessage(id) {
    const error = document.createElement("p");
    error.id = id;
    error.className = "calculator-error";
    error.setAttribute("aria-live", "polite");
    return error;
}
