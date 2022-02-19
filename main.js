/* -*- mode: js; js-indent-level: 2 -*- */

document.addEventListener('DOMContentLoaded', main);

function main() {
  console.log('main');

  let appContainer = document.querySelector('.application');
  dishAdd(appContainer);
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
  }
}

function _addBtnHandler(target, selector, handler) {
  target.querySelector(selector).addEventListener('click', handler);
}

function dishAdd(target) {
  let dish = _addTemplateItem(target, '.dish');

  _addBtnHandler(dish, '.dish .add', () => dishAdd(target));
  _addBtnHandler(dish, '.dish .delete', () => _deleteItem(dish, '.dish'));

  dish.querySelector('.weight_row input[name=dish_outcome]').addEventListener('change', recompute);
  dish.querySelector('.weight_row input[name=dish_portion]').addEventListener('change', recompute);

  let ingredientsContainer = dish.querySelector('.ingredients');

  _addBtnHandler(dish, '.ingredient .add', () => ingredientAdd(ingredientsContainer));
  _addBtnHandler(dish, '.ingredient .delete', (ev) => _deleteItem(ev.target.parentNode.parentNode, '.ingredient'));

  dish.querySelector('.weight_row input[name=ingredient_weight]').addEventListener('change', recompute);
}

function ingredientAdd(target) {
  let ingredient = _addTemplateItem(target, '.ingredient');

  _addBtnHandler(ingredient, '.ingredient .add', () => ingredientAdd(target));
  _addBtnHandler(ingredient, '.ingredient .delete', () => _deleteItem(ingredient, '.ingredient'));

  ingredient.querySelector('.weight_row input[name=ingredient_weight]').addEventListener('change', recompute);
}

function _getInputValue(target, name) {
  let value = target.querySelector('input[name=' + name + ']').value;
  return parseInt(value) || 0;
}

function recompute(ev) {
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
