/* -*- mode: js; js-indent-level: 2 -*- */

document.addEventListener('DOMContentLoaded', main);

function main() {
  console.log('main');

  let appContainer = document.querySelector('.application');

  let loaded = load(appContainer);

  if (!loaded) {
    dishAdd(appContainer);
  }
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
  }

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
  }

  recompute(dish);
}

function ingredientAdd(target, data) {
  let ingredient = _addTemplateItem(target, '.ingredient');

  if (!!data) {
    ingredient.querySelector('input[name=ingredient_name]').value = data['name'];
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

  return ret;
}

function save() {
  let dishes = Array.from(document.querySelectorAll('.application .dish'));
  dishes = dishes.map(_mapDish);
  dishes = JSON.stringify(dishes);

  localStorage.setItem('dishes', dishes);
}

function load(target) {
  let dishes = localStorage.getItem('dishes');
  if (!dishes) return false;

  dishes = JSON.parse(dishes);
  dishes = dishes.reverse();
  dishes.forEach((d) => dishAdd(target, d));

  return true;
}
