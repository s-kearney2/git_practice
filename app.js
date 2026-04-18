(() => {
  const STORAGE_KEY = "recipe-tracker.recipes.v1";

  const state = {
    recipes: [],
    selectedId: null,
    editingId: null,
    search: "",
    category: "",
    favoritesOnly: false,
  };

  const el = {
    list: document.getElementById("recipe-list"),
    empty: document.getElementById("empty-state"),
    placeholder: document.getElementById("placeholder"),
    view: document.getElementById("recipe-view"),
    form: document.getElementById("recipe-form"),
    search: document.getElementById("search-input"),
    categoryFilter: document.getElementById("category-filter"),
    favoritesOnly: document.getElementById("favorites-only"),
    newBtn: document.getElementById("new-recipe-btn"),
    importBtn: document.getElementById("import-btn"),
    exportBtn: document.getElementById("export-btn"),
    importFile: document.getElementById("import-file"),
    viewTitle: document.getElementById("view-title"),
    viewMeta: document.getElementById("view-meta"),
    viewTags: document.getElementById("view-tags"),
    viewIngredients: document.getElementById("view-ingredients"),
    viewInstructions: document.getElementById("view-instructions"),
    viewNotes: document.getElementById("view-notes"),
    viewNotesSection: document.getElementById("view-notes-section"),
    favoriteBtn: document.getElementById("favorite-btn"),
    editBtn: document.getElementById("edit-btn"),
    deleteBtn: document.getElementById("delete-btn"),
    formTitle: document.getElementById("form-title"),
    fTitle: document.getElementById("f-title"),
    fCategory: document.getElementById("f-category"),
    fServings: document.getElementById("f-servings"),
    fPrep: document.getElementById("f-prep"),
    fCook: document.getElementById("f-cook"),
    fTags: document.getElementById("f-tags"),
    fIngredients: document.getElementById("f-ingredients"),
    fInstructions: document.getElementById("f-instructions"),
    fNotes: document.getElementById("f-notes"),
    cancelBtn: document.getElementById("cancel-btn"),
  };

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      state.recipes = raw ? JSON.parse(raw) : [];
    } catch {
      state.recipes = [];
    }
  }

  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.recipes));
  }

  function uid() {
    return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
  }

  function splitLines(text) {
    return text
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function splitTags(text) {
    return text
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function visibleRecipes() {
    const q = state.search.toLowerCase();
    return state.recipes
      .filter((r) => {
        if (state.favoritesOnly && !r.favorite) return false;
        if (state.category && r.category !== state.category) return false;
        if (!q) return true;
        const hay = [
          r.title,
          r.category,
          r.notes,
          (r.tags || []).join(" "),
          (r.ingredients || []).join(" "),
          (r.instructions || []).join(" "),
        ]
          .join(" ")
          .toLowerCase();
        return hay.includes(q);
      })
      .sort((a, b) => a.title.localeCompare(b.title));
  }

  function renderCategoryFilter() {
    const categories = [
      ...new Set(state.recipes.map((r) => r.category).filter(Boolean)),
    ].sort();
    const current = state.category;
    el.categoryFilter.innerHTML =
      '<option value="">All categories</option>' +
      categories
        .map(
          (c) =>
            `<option value="${escapeAttr(c)}"${c === current ? " selected" : ""}>${escapeHtml(c)}</option>`
        )
        .join("");
  }

  function renderList() {
    const items = visibleRecipes();
    el.list.innerHTML = items
      .map((r) => {
        const sub = [r.category, r.totalTime ? `${r.totalTime} min` : ""]
          .filter(Boolean)
          .join(" · ");
        return `
          <li data-id="${r.id}" class="${r.id === state.selectedId ? "active" : ""}">
            <div>
              <div class="recipe-title">${escapeHtml(r.title)}</div>
              ${sub ? `<div class="recipe-sub">${escapeHtml(sub)}</div>` : ""}
            </div>
            ${r.favorite ? '<span class="star">&#9733;</span>' : ""}
          </li>`;
      })
      .join("");

    const hasAny = state.recipes.length > 0;
    const hasVisible = items.length > 0;
    el.empty.hidden = hasVisible;
    if (!hasAny) {
      el.empty.textContent = 'No recipes yet. Click "New Recipe" to add one.';
    } else if (!hasVisible) {
      el.empty.textContent = "No recipes match your filters.";
    }
  }

  function renderView() {
    const recipe = state.recipes.find((r) => r.id === state.selectedId);
    if (!recipe || state.editingId) {
      el.view.hidden = true;
      return;
    }
    el.placeholder.hidden = true;
    el.form.hidden = true;
    el.view.hidden = false;

    el.viewTitle.textContent = recipe.title;

    const metaParts = [];
    if (recipe.category) metaParts.push(recipe.category);
    if (recipe.servings) metaParts.push(`${recipe.servings} servings`);
    if (recipe.prepTime) metaParts.push(`Prep ${recipe.prepTime} min`);
    if (recipe.cookTime) metaParts.push(`Cook ${recipe.cookTime} min`);
    el.viewMeta.textContent = metaParts.join(" · ");

    el.viewTags.innerHTML = (recipe.tags || [])
      .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
      .join("");

    el.viewIngredients.innerHTML = (recipe.ingredients || [])
      .map((i) => `<li>${escapeHtml(i)}</li>`)
      .join("");

    el.viewInstructions.innerHTML = (recipe.instructions || [])
      .map((i) => `<li>${escapeHtml(i)}</li>`)
      .join("");

    if (recipe.notes) {
      el.viewNotesSection.hidden = false;
      el.viewNotes.textContent = recipe.notes;
    } else {
      el.viewNotesSection.hidden = true;
    }

    el.favoriteBtn.classList.toggle("active", !!recipe.favorite);
    el.favoriteBtn.innerHTML = recipe.favorite ? "&#9733;" : "&#9734;";
  }

  function render() {
    renderCategoryFilter();
    renderList();
    if (state.editingId) {
      el.placeholder.hidden = true;
      el.view.hidden = true;
      el.form.hidden = false;
    } else if (state.selectedId) {
      renderView();
    } else {
      el.view.hidden = true;
      el.form.hidden = true;
      el.placeholder.hidden = false;
    }
  }

  function escapeHtml(s) {
    return String(s ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function escapeAttr(s) {
    return escapeHtml(s);
  }

  function startNew() {
    state.editingId = "new";
    el.formTitle.textContent = "New Recipe";
    el.form.reset();
    render();
    el.fTitle.focus();
  }

  function startEdit(id) {
    const r = state.recipes.find((x) => x.id === id);
    if (!r) return;
    state.editingId = id;
    el.formTitle.textContent = "Edit Recipe";
    el.fTitle.value = r.title || "";
    el.fCategory.value = r.category || "";
    el.fServings.value = r.servings || "";
    el.fPrep.value = r.prepTime || "";
    el.fCook.value = r.cookTime || "";
    el.fTags.value = (r.tags || []).join(", ");
    el.fIngredients.value = (r.ingredients || []).join("\n");
    el.fInstructions.value = (r.instructions || []).join("\n");
    el.fNotes.value = r.notes || "";
    render();
    el.fTitle.focus();
  }

  function cancelEdit() {
    state.editingId = null;
    render();
  }

  function submitForm(e) {
    e.preventDefault();
    const prep = parseInt(el.fPrep.value, 10);
    const cook = parseInt(el.fCook.value, 10);
    const totalTime =
      (Number.isFinite(prep) ? prep : 0) + (Number.isFinite(cook) ? cook : 0) || null;

    const data = {
      title: el.fTitle.value.trim(),
      category: el.fCategory.value.trim(),
      servings: parseInt(el.fServings.value, 10) || null,
      prepTime: Number.isFinite(prep) ? prep : null,
      cookTime: Number.isFinite(cook) ? cook : null,
      totalTime,
      tags: splitTags(el.fTags.value),
      ingredients: splitLines(el.fIngredients.value),
      instructions: splitLines(el.fInstructions.value),
      notes: el.fNotes.value.trim(),
    };

    if (!data.title) return;

    if (state.editingId === "new") {
      const recipe = {
        id: uid(),
        favorite: false,
        createdAt: new Date().toISOString(),
        ...data,
      };
      state.recipes.push(recipe);
      state.selectedId = recipe.id;
    } else {
      const idx = state.recipes.findIndex((r) => r.id === state.editingId);
      if (idx !== -1) {
        state.recipes[idx] = { ...state.recipes[idx], ...data };
        state.selectedId = state.recipes[idx].id;
      }
    }
    state.editingId = null;
    save();
    render();
  }

  function deleteSelected() {
    if (!state.selectedId) return;
    const r = state.recipes.find((x) => x.id === state.selectedId);
    if (!r) return;
    if (!confirm(`Delete "${r.title}"?`)) return;
    state.recipes = state.recipes.filter((x) => x.id !== state.selectedId);
    state.selectedId = null;
    save();
    render();
  }

  function toggleFavorite() {
    const r = state.recipes.find((x) => x.id === state.selectedId);
    if (!r) return;
    r.favorite = !r.favorite;
    save();
    render();
  }

  function exportRecipes() {
    const blob = new Blob([JSON.stringify(state.recipes, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `recipes-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  function importRecipes(file) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result);
        if (!Array.isArray(parsed)) throw new Error("Expected a JSON array");
        const existingIds = new Set(state.recipes.map((r) => r.id));
        let added = 0;
        for (const item of parsed) {
          if (!item || typeof item !== "object" || !item.title) continue;
          const recipe = {
            id: item.id && !existingIds.has(item.id) ? item.id : uid(),
            title: String(item.title),
            category: item.category ? String(item.category) : "",
            servings: parseInt(item.servings, 10) || null,
            prepTime: parseInt(item.prepTime, 10) || null,
            cookTime: parseInt(item.cookTime, 10) || null,
            totalTime: parseInt(item.totalTime, 10) || null,
            tags: Array.isArray(item.tags) ? item.tags.map(String) : [],
            ingredients: Array.isArray(item.ingredients)
              ? item.ingredients.map(String)
              : [],
            instructions: Array.isArray(item.instructions)
              ? item.instructions.map(String)
              : [],
            notes: item.notes ? String(item.notes) : "",
            favorite: !!item.favorite,
            createdAt: item.createdAt || new Date().toISOString(),
          };
          state.recipes.push(recipe);
          existingIds.add(recipe.id);
          added++;
        }
        save();
        render();
        alert(`Imported ${added} recipe${added === 1 ? "" : "s"}.`);
      } catch (err) {
        alert(`Import failed: ${err.message}`);
      }
    };
    reader.readAsText(file);
  }

  function attachEvents() {
    el.newBtn.addEventListener("click", startNew);
    el.editBtn.addEventListener("click", () => startEdit(state.selectedId));
    el.deleteBtn.addEventListener("click", deleteSelected);
    el.favoriteBtn.addEventListener("click", toggleFavorite);
    el.cancelBtn.addEventListener("click", cancelEdit);
    el.form.addEventListener("submit", submitForm);

    el.search.addEventListener("input", (e) => {
      state.search = e.target.value;
      renderList();
    });
    el.categoryFilter.addEventListener("change", (e) => {
      state.category = e.target.value;
      renderList();
    });
    el.favoritesOnly.addEventListener("change", (e) => {
      state.favoritesOnly = e.target.checked;
      renderList();
    });

    el.list.addEventListener("click", (e) => {
      const li = e.target.closest("li[data-id]");
      if (!li) return;
      state.selectedId = li.dataset.id;
      state.editingId = null;
      render();
    });

    el.exportBtn.addEventListener("click", exportRecipes);
    el.importBtn.addEventListener("click", () => el.importFile.click());
    el.importFile.addEventListener("change", (e) => {
      const file = e.target.files[0];
      if (file) importRecipes(file);
      e.target.value = "";
    });
  }

  load();
  attachEvents();
  render();
})();
