const form = document.getElementById("forma");

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
        discipline: {
            code: formData.get("oblast"),
            name: form.elements["oblast"].selectedOptions[0].textContent.trim()
        },
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

function processOffer(offer) {
    console.log(offer);
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
