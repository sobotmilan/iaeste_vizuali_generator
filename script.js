const form = document.getElementById("forma");

// Serbian Latin collation keeps Č, Ć, Đ, Š and Ž in their alphabetical positions.
function sortDropdownOptions(select) {
    const selectedValue = select.value;
    const collator = new Intl.Collator("sr-Latn", { sensitivity: "base" });
    const options = [...select.options];
    const placeholders = options.filter(option => option.value === "");
    const entries = options.filter(option => option.value !== "")
        .sort((a, b) => collator.compare(a.textContent.trim(), b.textContent.trim()));
    select.replaceChildren(...placeholders, ...entries);
    select.value = selectedValue;
}

["drzava", "oblast"].forEach(id => sortDropdownOptions(document.getElementById(id)));


// A single picker adds structured selections to the table in selection order.
const disciplineList = document.getElementById("discipline-list");
const disciplinePicker = document.getElementById("oblast");
const selectedDisciplines = [];
const customDisciplineInput = document.getElementById("custom-discipline");
let customDisciplineSequence = 0;

function normalizeDisciplineName(name) {
    return name.trim().replace(/\s+/gu, " ").normalize("NFC").toLocaleLowerCase("sr-Latn");
}

function hasDisciplineName(name) {
    return selectedDisciplines.some(discipline =>
        normalizeDisciplineName(discipline.name) === normalizeDisciplineName(name));
}

function addCustomDiscipline() {
    const name = customDisciplineInput.value.trim().replace(/\s+/gu, " ").normalize("NFC");
    const status = document.getElementById("custom-discipline-status");
    if (!name) {
        status.textContent = "Unesite naziv stručne oblasti.";
        customDisciplineInput.focus();
        return;
    }
    if (hasDisciplineName(name)) {
        status.textContent = "Ova stručna oblast je već dodana.";
        customDisciplineInput.focus();
        return;
    }
    // Reuse a catalogue code if the custom text matches a predefined name.
    const existing = [...disciplinePicker.options].find(option => option.value &&
        normalizeDisciplineName(option.textContent) === normalizeDisciplineName(name));
    selectedDisciplines.push({ code: existing ? existing.value : `custom-${++customDisciplineSequence}`, name });
    customDisciplineInput.value = "";
    status.textContent = "Oblast je dodana.";
    updateDisciplinePreview();
    customDisciplineInput.focus();
}

document.getElementById("add-custom-discipline").addEventListener("click", addCustomDiscipline);
customDisciplineInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
        event.preventDefault();
        addCustomDiscipline();
    }
});
customDisciplineInput.addEventListener("input", () => {
    document.getElementById("custom-discipline-status").textContent = "";
});

function getDisciplines() {
    return selectedDisciplines.map(discipline => ({ ...discipline }));
}

function formatDisciplines(disciplines) {
    return disciplines.map(discipline => discipline.name).join("; ");
}

function updateDisciplinePreview() {
    disciplineList.replaceChildren();
    if (!selectedDisciplines.length) {
        const row = document.createElement("tr");
        const cell = document.createElement("td");
        cell.colSpan = 2;
        cell.textContent = "Još nema odabranih oblasti.";
        row.append(cell);
        disciplineList.append(row);
    }
    selectedDisciplines.forEach(discipline => {
        const row = document.createElement("tr");
        const name = document.createElement("td");
        name.textContent = discipline.name;
        const action = document.createElement("td");
        const remove = document.createElement("button");
        remove.type = "button";
        remove.className = "remove-discipline";
        remove.dataset.code = discipline.code;
        remove.textContent = "Ukloni";
        remove.setAttribute("aria-label", `Ukloni: ${discipline.name}`);
        action.append(remove);
        row.append(name, action);
        disciplineList.append(row);
    });
    for (const option of disciplinePicker.options) {
        if (option.value) option.disabled = selectedDisciplines.some(discipline => discipline.code === option.value);
    }
    document.getElementById("add-discipline").disabled = !disciplinePicker.value ||
        selectedDisciplines.some(discipline => discipline.code === disciplinePicker.value);
    document.getElementById("discipline-preview-text").textContent = selectedDisciplines.length
        ? formatDisciplines(selectedDisciplines) : "Odaberite stručnu oblast.";
}

function addDiscipline() {
    const option = disciplinePicker.selectedOptions[0];
    if (!option || !option.value || hasDisciplineName(option.textContent) || selectedDisciplines.some(discipline => discipline.code === option.value)) return;
    selectedDisciplines.push({
        code: option.value,
        name: option.textContent.trim().replace(/\s+/gu, " ")
    });
    disciplinePicker.value = "";
    updateDisciplinePreview();
    disciplinePicker.focus();
}

document.getElementById("add-discipline").addEventListener("click", addDiscipline);
disciplinePicker.addEventListener("change", updateDisciplinePreview);
disciplineList.addEventListener("click", event => {
    const remove = event.target.closest("button.remove-discipline");
    if (!remove) return;
    const index = selectedDisciplines.findIndex(discipline => discipline.code === remove.dataset.code);
    if (index !== -1) selectedDisciplines.splice(index, 1);
    updateDisciplinePreview();
    disciplinePicker.focus();
});
updateDisciplinePreview();

const LANGUAGE_OPTIONS = [
    "Engleski", "Njemački", "Francuski", "Španski", "Italijanski",
    "Portugalski", "Ruski", "Kineski", "Japanski", "Arapski", "Drugi"
];
const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const languageList = document.getElementById("language-list");
const addLanguageButton = document.getElementById("add-language");
const languageRelationField = document.getElementById("language-relation-field");
let languageSequence = 0;

function addLanguage() {
    const id = ++languageSequence;
    const card = document.createElement("div");
    card.className = "language-card";
    card.innerHTML = `
        <div class="language-card-heading">
            <h3>Jezik</h3>
            <button type="button" class="remove-language">Ukloni</button>
        </div>
        <div class="form-group">
            <label for="language-${id}">Odaberite jezik:</label>
            <select id="language-${id}" class="language-select" required>
                <option value="">Odaberite jezik</option>
                ${LANGUAGE_OPTIONS.map(language => `<option value="${language}">${language}</option>`).join("")}
            </select>
        </div>
        <div class="form-group language-custom" hidden>
            <label for="custom-language-${id}">Naziv drugog jezika:</label>
            <input id="custom-language-${id}" type="text" placeholder="Unesite naziv jezika" />
        </div>
        <div class="cefr-group" role="group" aria-label="Prihvatljivi CEFR nivoi">
            <span>Prihvatljivi CEFR nivoi:</span>
            <div class="cefr-choices">
                ${CEFR_LEVELS.map(level => `<label><input type="checkbox" value="${level}" /> ${level}</label>`).join("")}
            </div>
        </div>
    `;
    languageList.append(card);
    const select = card.querySelector(".language-select");
    const customGroup = card.querySelector(".language-custom");
    const customInput = customGroup.querySelector("input");
    select.addEventListener("change", () => {
        const isOther = select.value === "Drugi";
        customGroup.hidden = !isOther;
        customInput.required = isOther;
        if (!isOther) customInput.value = "";
        updateLanguagePreview();
    });
    card.querySelector(".remove-language").addEventListener("click", () => {
        card.remove();
        updateLanguagePreview();
    });
    card.addEventListener("input", updateLanguagePreview);
    card.addEventListener("change", updateLanguagePreview);
    updateLanguagePreview();
}

function getLanguageRequirements() {
    return [...languageList.querySelectorAll(".language-card")].map(card => {
        const selection = card.querySelector(".language-select").value;
        return {
            language: selection === "Drugi"
                ? card.querySelector(".language-custom input").value.trim()
                : selection,
            levels: [...card.querySelectorAll('.cefr-choices input:checked')].map(input => input.value)
        };
    });
}

function formatLanguageRequirements(languages, relation) {
    return languages.map(({ language, levels }) =>
        `${language || "Odaberite jezik"} (${levels.length ? levels.join(", ") : "odaberite nivo"})`
    ).join(relation === "and" ? " i " : " ili ");
}

function updateLanguagePreview() {
    const entries = getLanguageRequirements();
    languageRelationField.hidden = entries.length < 2;
    languageList.querySelectorAll(".language-card").forEach((card, index) => {
        card.querySelector("h3").textContent = `Jezik ${index + 1}`;
        card.querySelector(".remove-language").hidden = entries.length === 1;
    });
    document.getElementById("language-preview-text").textContent =
        entries.length
            ? formatLanguageRequirements(entries, document.querySelector('input[name="languageRelation"]:checked').value)
            : "Odaberite jezik i nivo.";
}

addLanguageButton.addEventListener("click", addLanguage);
languageRelationField.addEventListener("change", updateLanguagePreview);
addLanguage();

function getOfferData(form) {
    const formData = new FormData(form);

    const offer = {
        country: {
            code: formData.get("drzava"),
            name: form.elements["drzava"].selectedOptions[0].textContent.trim()
        },
        city: formData.get("grad").trim(),
        disciplines: getDisciplines(),
        reference: formData.get("refbr").trim(),

        duration: {
            min: Number(formData.get("min")),
            max: formData.get("max")
                ? Number(formData.get("max"))
                : null
        },

        period: {
            start: formData.get("od"),
            end: formData.get("do")
        },

        compensation: {
            amount: Number(formData.get("plata")),
            currency: "KM",
            frequency: formData.get("periodIsplate")
        },

        studyYears: Number(formData.get("uslov")),
        languages: getLanguageRequirements(),
        languageRelation: document.querySelector('input[name="languageRelation"]:checked').value,
        deadline: formData.get("rok"),
        theme: formData.get("boja")
    };

    return offer;
}

function validateOffer(offer) {
    if (!offer.disciplines.length || offer.disciplines.some(discipline => !discipline.code || !discipline.name)) {
        return "Odaberite stručnu oblast u svakom dodanom polju!";
    }
    if (new Set(offer.disciplines.map(discipline => discipline.code)).size !== offer.disciplines.length) {
        return "Istu stručnu oblast nije potrebno dodavati više puta!";
    }

    if (offer.period.end < offer.period.start) {
        return "Datum završetka prakse ne smije biti prije datuma početka!";
    }

    if (
        offer.duration.max !== null &&
        offer.duration.max < offer.duration.min
    ) {
        return "Maksimalno trajanje ne smije biti kraće od minimalnog!";
    }

    if (offer.deadline > offer.period.end) {
        return "Rok za prijavu ne smije biti nakon završetka prakse!";
    }

    if (offer.languages.length === 0 || offer.languages.some(entry => !entry.language || entry.levels.length === 0)) {
        return "Za svaki jezik odaberite naziv i najmanje jedan CEFR nivo!";
    }
    if (new Set(offer.languages.map(entry => entry.language.toLocaleLowerCase("sr-Latn"))).size !== offer.languages.length) {
        return "Isti jezik nije potrebno dodavati više puta!";
    }

    return null;
}

const SVG_NS = "http://www.w3.org/2000/svg";
const MONTH_NAMES = [
    "Januar", "Februar", "Mart", "April", "Maj", "Jun",
    "Jul", "Avgust", "Septembar", "Oktobar", "Novembar", "Decembar"
];

// Parse date parts directly to avoid timezone shifts for date-only form values.
function formatOfferMonth(value) {
    const [year, month] = value.split("-");
    return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
}

function formatOfferDate(value) {
    const [year, month, day] = value.split("-");
    return `${day}.${month}.${year}.`;
}

// Measure SVG text at its actual font size. Long words can wrap by character.
function wrapVisualText(element, text, width) {
    const lines = [];
    let line = "";
    for (const word of text.trim().split(/\s+/u)) {
        const candidate = line ? `${line} ${word}` : word;
        element.textContent = candidate;
        if (element.getComputedTextLength() <= width) {
            line = candidate;
            continue;
        }
        if (line) lines.push(line);
        line = "";
        for (const character of word) {
            element.textContent = line + character;
            if (line && element.getComputedTextLength() > width) {
                lines.push(line);
                line = character;
            } else {
                line += character;
            }
        }
    }
    if (line) lines.push(line);
    return lines;
}

function fitVisualText(svg, id, text, { size, minSize = 18, maxLines = 1, maxHeight = 80, maxWidth = 520, label = "" }) {
    const element = svg.querySelector(`#${id}`);
    const y = Number(element.getAttribute("y"));
    for (let fontSize = size; fontSize >= minSize; fontSize--) {
        element.style.fontSize = `${fontSize}px`;
        const lines = wrapVisualText(element, text, maxWidth);
        const lineHeight = fontSize * 1.3;
        if (lines.length > maxLines || lines.length * lineHeight > maxHeight) continue;
        element.replaceChildren(...lines.map((line, index) => {
            const span = document.createElementNS(SVG_NS, "tspan");
            span.setAttribute("x", "540");
            span.setAttribute("y", String(y + index * lineHeight));
            if (index === 0 && label && line.startsWith(label)) {
                const labelSpan = document.createElementNS(SVG_NS, "tspan");
                labelSpan.setAttribute("font-weight", "400");
                labelSpan.textContent = label;
                const valueSpan = document.createElementNS(SVG_NS, "tspan");
                valueSpan.textContent = line.slice(label.length);
                span.append(labelSpan, valueSpan);
            } else {
                span.textContent = line;
            }
            return span;
        }));
        return;
    }
    throw new Error("Tekst je predugačak za vizual. Skratite unos: " + text);
}

async function processOffer(offer) {
    const preview = document.getElementById("visual-preview");
    const container = document.getElementById("visual-container");
    const status = document.getElementById("visual-status");
    const button = document.getElementById("generisi");
    button.disabled = true;
    status.textContent = "Generisanje vizuala…";
    try {
        const svg = document.getElementById("offer-template").content
            .querySelector("svg").cloneNode(true);
        const theme = ["dark-blue", "light-blue", "green"].includes(offer.theme)
            ? offer.theme : "dark-blue";
        svg.querySelector("#visual-panel").setAttribute("fill", `url(#${theme})`);
        svg.querySelector("#visual-badge path").setAttribute("fill", `url(#${theme})`);
        svg.querySelector("#template-title").textContent =
            `IAESTE BiH - ${offer.country.name}, ${offer.city}`;
        svg.querySelector("#template-description").textContent =
            `Ponuda za stručnu praksu ${offer.reference}.`;
        // The SVG must be visible in the DOM for browser text measurements.
        container.replaceChildren(svg);
        preview.hidden = false;
        // Load all used weights before measuring; never fit text using fallback metrics.
        await Promise.all([400, 700, 800].map(weight =>
            document.fonts.load(`${weight} 40px "IAESTE Mulish"`)));
        await document.fonts.ready;

        // Base sizes enlarged by 4/3 relative to the supplied Canva values.
        const setText = (id, text, settings) => fitVisualText(svg, id, text, settings);
        const setInline = (id, label, value, settings) =>
            fitVisualText(svg, id, `${label}: ${value}`, { ...settings, label: `${label}: ` });
        setText("visual-country", offer.country.name.toLocaleUpperCase("sr-Latn"),
            { size: 104.5, minSize: 24, maxLines: 1, maxHeight: 150, maxWidth: 520 });
        setText("visual-city", offer.city, { size: 50, maxLines: 1, maxHeight: 80 });
        setText("visual-discipline", formatDisciplines(offer.disciplines),
            { size: 40, minSize: 18, maxLines: 6, maxHeight: 180 });
        setText("visual-reference", offer.reference, { size: 40 });
        setText("visual-period", `${formatOfferMonth(offer.period.start)} - ${formatOfferMonth(offer.period.end)}`,
            { size: 40, minSize: 18, maxLines: 1, maxHeight: 80 });
        const weeks = offer.duration.max !== null && offer.duration.max !== offer.duration.min
            ? `${offer.duration.min} - ${offer.duration.max}` : String(offer.duration.min);
        const weekLabel = offer.duration.max === null || offer.duration.max === offer.duration.min
            ? (offer.duration.min % 10 === 1 && offer.duration.min % 100 !== 11 ? "sedmica"
                : offer.duration.min % 10 >= 2 && offer.duration.min % 10 <= 4 &&
                    !(offer.duration.min % 100 >= 12 && offer.duration.min % 100 <= 14) ? "sedmice" : "sedmica")
            : "sedmica";
        setInline("visual-duration", "Trajanje", `${weeks} ${weekLabel}`, { size: 37.33 });
        const salary = new Intl.NumberFormat("bs-BA", { maximumFractionDigits: 2 })
            .format(offer.compensation.amount);
        const frequency = offer.compensation.frequency === "sedmicno" ? "sedmično" : "mjesečno";
        setInline("visual-salary", "Plata", `${salary} ${offer.compensation.currency} / ${frequency}`, { size: 37.33 });
        const studyText = offer.studyYears === 1 ? "Završena 1 godina"
            : `Završene ${offer.studyYears} godine`;
        setInline("visual-study-years", "Uslov", studyText, { size: 37.33 });
        setInline("visual-language", "Jezik", formatLanguageRequirements(offer.languages, offer.languageRelation),
            { size: 37.33, minSize: 18, maxLines: 5, maxHeight: 130 });
        setText("visual-deadline", formatOfferDate(offer.deadline), { size: 40 });
        status.textContent = "Vizual je generisan. Bočne ilustracije su privremene do dodavanja fotografija.";
        preview.scrollIntoView({ behavior: "smooth", block: "start" });
    } catch (error) {
        preview.hidden = true;
        container.replaceChildren();
        status.textContent = error.message || "Vizual nije moguće generisati. Pokušajte ponovo.";
    } finally {
        button.disabled = false;
    }
}

form.addEventListener("submit", function (event) {
    event.preventDefault();

    const offer = getOfferData(form);
    const validationError = validateOffer(offer);

    if (validationError !== null) {
        alert(validationError);
        return;
    }

    processOffer(offer);
});
