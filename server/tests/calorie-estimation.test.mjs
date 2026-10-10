import assert from 'node:assert/strict';
import test from 'node:test';
import {
  estimateExerciseCalories,
  EXERCISE_CALORIE_RATES,
  sumWorkoutCalories,
} from '../dist/services/calorieEstimation.js';

test('exercise estimates use each exercise MET and body weight', () => {
  assert.equal(estimateExerciseCalories('ex_squats', 80, 60), 4);
  assert.equal(estimateExerciseCalories('ex_pushups', 60, 60), 8);
  assert.equal(estimateExerciseCalories('ex_lunges', 80, 60), 5);
  assert.equal(estimateExerciseCalories('ex_jumping_jacks', 80, 60), 11);
  assert.equal(estimateExerciseCalories('ex_plank', 80, 45), 3);
  assert.equal(EXERCISE_CALORIE_RATES.ex_plank.intensity, 'low');
});

test('weight and active duration change the estimate', () => {
  assert.equal(estimateExerciseCalories('ex_squats', 100, 60), 5);
  assert.equal(estimateExerciseCalories('ex_squats', 80, 120), 8);
  assert.equal(estimateExerciseCalories('ex_squats', 80, 30), 2);
});

test('missing or invalid weight and duration leave the estimate unavailable', () => {
  assert.equal(estimateExerciseCalories('ex_squats', undefined, 60), undefined);
  assert.equal(estimateExerciseCalories('ex_squats', 0, 60), undefined);
  assert.equal(estimateExerciseCalories('ex_squats', 80, undefined), undefined);
});

test('multiple set estimates sum only when every set has an estimate', () => {
  const calories = [
    estimateExerciseCalories('ex_squats', 80, 60),
    estimateExerciseCalories('ex_squats', 80, 30),
    estimateExerciseCalories('ex_plank', 80, 45),
  ];
  assert.equal(sumWorkoutCalories(calories), 9);
  assert.equal(sumWorkoutCalories([4, undefined]), undefined);
  assert.equal(sumWorkoutCalories([]), undefined);
});
