const express = require("express");
const cors = require("cors");

const { v4: uuidv4 } = require("uuid");

const app = express();

app.use(cors());
app.use(express.json());

const users = [];

function checksExistsUserAccount(request, response, next) {
  const { username } = request.headers;

  const user = findUserByUsername(username);

  if (!user)
    return response.status(400).json({
      error: "User not found",
    });

  request.user = user;

  return next();
}

function checksIfTodoExists(request, response, next) {
  const { username } = request.headers;
  const { id } = request.params;

  const user = findUserByUsername(username);
  const todo = findTodo(user, id);

  if (!todo) return response.status(404).json({ error: "To-do not found!" });

  request.todo = todo;

  return next();
}

function findTodo(user, id) {
  const todo = user.todos.find((todo) => id === todo.id);
  return todo;
}

function findUserByUsername(username) {
  const user = users.find((user) => username === user.username);
  return user;
}

app.post("/users", (request, response) => {
  const { name, username } = request.body;

  const userAlreadyExists = users.some((user) => username === user.username);

  if (userAlreadyExists)
    return response.status(400).json({
      error: "User already exists",
    });

  const newUser = { id: uuidv4(), name, username, todos: [] };
  users.push(newUser);

  return response.status(201).json(newUser);
});

app.get("/todos", checksExistsUserAccount, (request, response) => {
  const { user } = request;
  const todos = user.todos;

  if (!todos) return null;

  return response.status(200).send(todos);
});

app.post("/todos", checksExistsUserAccount, (request, response) => {
  const { title, deadline } = request.body;

  const { user } = request;

  const userTodos = user.todos;

  const todo = {
    id: uuidv4(),
    title,
    done: false,
    deadline: new Date(deadline),
    created_at: new Date(),
  };

  userTodos.push(todo);

  return response.status(201).send(todo);
});

app.put(
  "/todos/:id",
  checksExistsUserAccount,
  checksIfTodoExists,
  (request, response) => {
    const { todo } = request;

    const { title, deadline } = request.body;

    todo.title = title;
    todo.deadline = new Date(deadline);

    return response.status(200).send(todo);
  }
);

app.patch(
  "/todos/:id/done",
  checksExistsUserAccount,
  checksIfTodoExists,
  (request, response) => {
    const { todo } = request;

    todo.done = true;

    return response.status(200).send(todo);
  }
);

app.delete(
  "/todos/:id",
  checksExistsUserAccount,
  checksIfTodoExists,
  (request, response) => {
    const { user, todo } = request;

    user.todos.splice(todo, 1);
    return response.status(204).json(user.todos);
  }
);

module.exports = app;
