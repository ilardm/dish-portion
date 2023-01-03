/* -*- mode: js; js-indent-level: 2 -*- */
/* vim: set shiftwidth=2 */

document.addEventListener('DOMContentLoaded', main);

function main() {
  console.log('main');

  let appContainer = document.querySelector('.application');

  let loaded = load(appContainer);

  if (!loaded) {
    dishAdd(appContainer);
  }

  _setupMenuHandler();
}

function _setupMenuHandler() {
  // https://www.w3schools.com/howto/howto_js_navbar_hide_scroll.asp

  let prevPos = window.pageYOffset;
  let menu = document.getElementById('menu');

  window.addEventListener('scroll', () => {
    let pos = window.pageYOffset;
    if (prevPos > pos) {
      menu.classList.remove('hidden');
    } else {
      menu.classList.add('hidden');
    }
    prevPos = pos;
  });

  _addBtnHandler(menu, 'input[type="button"].export', exportHandler);
  _addBtnHandler(menu, 'input[type="button"].import', importHandler);

  _addBtnHandler(menu, 'input[type="button"].search', searchBtnHandler);
  menu.querySelector('input[name="search_text"]').addEventListener('keyup', searchTextHandler);
  _addBtnHandler(menu, 'input[type="button"].close', searchBtnHandler);
}

function _addTemplateItem(target, selector) {
  let template = document.querySelector('.template ' + selector).cloneNode(true);

  let node;
  if (!!target.firstChild) {
    node = target.insertBefore(template, target.firstChild);
  } else {
    node = target.appendChild(template);
  }

  return node;
}

function _deleteItem(node, selector) {
  let parent = node.parentNode;
  let childs = parent.querySelectorAll(selector);

  if (childs.length > 1) {
    parent.removeChild(node);
    save();
  }
}

function _addBtnHandler(target, selector, handler) {
  target.querySelector(selector).addEventListener('click', handler);
}

function dishAdd(target, data) {
  let dish = _addTemplateItem(target, '.dish');

  if (!!data) {
    dish.querySelector('input[name=dish_name]').value = data['name'];
    dish.querySelector('.weight_row input[name=dish_outcome]').value = data['outcome'];
    dish.querySelector('.weight_row input[name=dish_portion]').value = data['portion'];

    if (!!data._state?.folded) {
      dish.classList.add('folded');
    }
  }

  _addBtnHandler(dish, '.dish .fold', () => _toggleFolded(dish));
  _addBtnHandler(dish, '.dish .add', () => dishAdd(target));
  _addBtnHandler(dish, '.dish .delete', () => _deleteItem(dish, '.dish'));

  dish.querySelector('input[name=dish_name]').addEventListener('change', save);
  dish.querySelector('.weight_row input[name=dish_outcome]').addEventListener('change', _onWeightsInputChange);
  dish.querySelector('.weight_row input[name=dish_portion]').addEventListener('change', _onWeightsInputChange);

  let ingredientsContainer = dish.querySelector('.ingredients');

  if (!!data) {
    let ingredients = data['ingredients'].reverse();
    ingredients.forEach((i) => ingredientAdd(ingredientsContainer, i));
  } else {
    ingredientAdd(ingredientsContainer);
    dish.querySelector('input[name=dish_name]').focus()
  }

  recompute(dish);
}

function _toggleFolded(target) {
  target.classList.toggle('folded');

  save();
}

function ingredientAdd(target, data) {
  let ingredient = _addTemplateItem(target, '.ingredient');

  if (!!data) {
    ingredient.querySelector('input[name=ingredient_name]').value = data['name'];
  } else {
    ingredient.querySelector('input[name=ingredient_name]').focus();
  }

  _addBtnHandler(ingredient, '.ingredient .add', () => ingredientAdd(target));
  _addBtnHandler(ingredient, '.ingredient .delete', () => _deleteItem(ingredient, '.ingredient'));

  ingredient.querySelector('input[name=ingredient_name]').addEventListener('change', save);
  ingredient.querySelector('.weight_row input[name=ingredient_weight]').addEventListener('change', _onWeightsInputChange);

  if (!!data) {
    ingredient.querySelector('.weight_row input[name=ingredient_weight]').value = data['weight'];
  }
}

function _onWeightsInputChange(ev) {
  let dish = ev.target;
  let check = (n) => n.classList.contains('dish')

  while (!check(dish)) {
    if (!dish.parentNode) break;

    dish = dish.parentNode;
  }

  if (!check(dish)) {
    console.log('failed to find a dish');
    return;
  }

  save();
  recompute(dish);
}

function _getInputValue(target, name) {
  let value = target.querySelector('input[name=' + name + ']').value;
  return parseInt(value) || 0;
}

function recompute(dish) {
  let ingredients = Array.from(dish.querySelectorAll('.ingredient'));

  let total = ingredients.reduce(
    (a, i) => a + _getInputValue(i, 'ingredient_weight'),
    0
  );

  dish.querySelector('input[name=dish_total]').value = total;

  let outcome = _getInputValue(dish, 'dish_outcome');
  let portion = _getInputValue(dish, 'dish_portion');

  let proceed = total > 0 && outcome > 0 && portion > 0;

  if (!proceed) return;

  let factor = portion / outcome;

  ingredients.forEach((i) => {
    let weight = _getInputValue(i, 'ingredient_weight');
    let value = weight * factor;
    i.querySelector('input[name=ingredient_portion]').value = value.toFixed(2);
  });
}

function _mapIngredient(ingredient) {
  let name = ingredient.querySelector('input[name=ingredient_name]').value;
  let weight = ingredient.querySelector('input[name=ingredient_weight]').value;

  let ret = {
    'name': name,
    'weight': weight,
  }

  return ret;
}

function _mapDish(dish) {
  let name = dish.querySelector('input[name=dish_name]').value;
  let ingredients = Array.from(dish.querySelectorAll('.ingredient'));
  let outcome = dish.querySelector('input[name=dish_outcome]').value;
  let portion = dish.querySelector('input[name=dish_portion]').value;

  let ret = {
    'name': name,
    'ingredients': ingredients.map(_mapIngredient),
    'outcome': outcome,
    'portion': portion,
  };

  if (dish.classList.contains('folded')) {
    ret['_state'] = {'folded': true};
  }

  return ret;
}

function _dishPageToJSON() {
  let dishes = Array.from(document.querySelectorAll('.application .dish'));
  dishes = dishes.map(_mapDish);
  dishes = JSON.stringify(dishes);

  return dishes;
}

function save() {
  let dishes = _dishPageToJSON();

  localStorage.setItem('dishes', dishes);
}

function load(target, dishes) {
  if (!dishes) {
    dishes = localStorage.getItem('dishes');
    if (!dishes) return false;
  }

  try {
    dishes = JSON.parse(dishes);
  } catch (e) {
    alert('invalid data provided');
    return false;
  }
  dishes = dishes.reverse();
  dishes.forEach((d) => dishAdd(target, d));

  return true;
}

function _getExportImportDialog(isExport=false) {
  let dialog = document.getElementById('import_export_dialog');
  if (isExport) {
    dialog.classList.remove('import');
    dialog.classList.add('export');
  } else {
    dialog.classList.remove('export');
    dialog.classList.add('import');
  }

  let textarea = dialog.querySelector('textarea');
  if (isExport) {
    textarea.setAttribute('readonly', '');
  } else {
    textarea.removeAttribute('readonly');
  }

  return [dialog, textarea];
}

function exportHandler() {
  let dishes = _dishPageToJSON();

  let [dialog, textarea] = _getExportImportDialog(true);
  textarea.value = dishes;

  dialog.showModal();
}

function importHandler() {
  let [dialog, textarea] = _getExportImportDialog(false);
  textarea.value = '';

  dialog.addEventListener('close', () => {
    if (dialog.returnValue == 'cancel') return;

    let dishes = textarea.value;

    if (!dishes) return;

    let appContainer = document.querySelector('.application');

    let loaded = load(appContainer, dishes);
    if (loaded) {
      save();
    }
  }, {once: true});

  dialog.showModal();
}

function searchBtnHandler(ev) {
  let isOpen = ev.target.classList.contains('search');
  let isClose = ev.target.classList.contains('close');

  let menu = document.getElementById('menu');

  if (isOpen) {
    // expand
    menu.querySelector('input[type="button"].export').classList.add('hidden');
    menu.querySelector('input[type="button"].import').classList.add('hidden');

    // show search controls
    menu.querySelector('input[name="search_text"]').classList.remove('hidden');
    menu.querySelector('input[type="button"].close').classList.remove('hidden');

    menu.querySelector('input[name="search_text"]').focus();
  } else if (isClose) {
    // expand
    menu.querySelector('input[type="button"].export').classList.remove('hidden');
    menu.querySelector('input[type="button"].import').classList.remove('hidden');

    // hide search controls
    menu.querySelector('input[name="search_text"]').classList.add('hidden');
    menu.querySelector('input[type="button"].close').classList.add('hidden');

    // clear filters
    ev.target.parentNode.querySelector('input[name="search_text"]').value='';
    _doSearch('');
  }
}

function searchTextHandler(ev) {
  let text = ev.target.value.toLowerCase();
  _doSearch(text);
}

function _doSearch(text) {
  let dishes = Array.from(document.querySelectorAll('.application .dish'));

  dishes.forEach((d) => {
    let dishName = d.querySelector('input[name="dish_name"]').value.toLowerCase();

    let found = dishName.search(text) >= 0;
    if (!found) {
      d.classList.add('hidden');
    } else {
      d.classList.remove('hidden');
    }
  });
}
