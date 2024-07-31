import React, { useEffect, useRef, useState } from 'react';
import { UserWarning } from './UserWarning';
import {
  USER_ID,
  getTodos,
  deleteTodos,
  createTodos,
  updateTodos,
} from './api/todos';
import { Todo } from './types/Todo';
import { FilterTypes } from './types/filterTypes';
import { TodoList } from './TodoList/TodoList';
import { TodoFooter } from './TodoFooter/TodoFooter';
import { TodoHeader } from './TodoHeader/TodoHeader';
import { TodoErrors } from './TodoErrors/TodoErrors';
import { getFilteredTodos } from './components/filteredTodos';

export const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [newTodosTitle, setNewTodosTitle] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState('');
  const [filter, setFilter] = useState<FilterTypes>(FilterTypes.All);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const [fakeTodo, setFakeTodo] = useState<Todo | null>(null);
  const [loadingTodoId, setLoadingTodoId] = useState<number[]>([]);
  const [editingTodoId, setEditingTodoId] = useState<number | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');

  useEffect(() => {
    getTodos()
      .then(setTodos)
      .catch(() => setErrorMessage('Unable to load todos'));
  }, []);

  useEffect(() => {
    if (errorMessage) {
      const timer = setTimeout(() => {
        setErrorMessage('');
      }, 3000);

      return () => clearTimeout(timer);
    }

    return undefined;
  }, [errorMessage]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [todos, errorMessage]);

  if (!USER_ID) {
    return <UserWarning />;
  }

  function addTodo({ title, userId, completed }: Omit<Todo, 'id'>) {
    const trimmedTitle = title.trim();

    if (trimmedTitle === '') {
      setErrorMessage('Title should not be empty');
      setIsSubmitting(false);

      return;
    }

    const tempTodo: Todo = {
      id: 0,
      title,
      userId,
      completed,
    };

    setFakeTodo(tempTodo);
    setLoadingTodoId(prevIds => [...prevIds, tempTodo.id]);
    createTodos({ title: trimmedTitle, userId, completed })
      .then(newTodo => {
        setFakeTodo(null);
        setTodos(currentTodos => [
          ...currentTodos,
          {
            id: newTodo.id,
            title: trimmedTitle,
            userId: newTodo.userId,
            completed: newTodo.completed,
          },
        ]);
        setNewTodosTitle('');
        setIsSubmitting(false);
      })
      .catch(() => {
        setErrorMessage('Unable to add a todo');
        setLoadingTodoId(prevIds => prevIds.filter(id => id !== tempTodo.id));
        setFakeTodo(null);
        setIsSubmitting(false);
      });
  }

  function updateTodoo(updatedTodo: Todo) {
    setLoadingTodoId(prevIds => [...prevIds, updatedTodo.id]);
    updateTodos(updatedTodo)
      .then(() => {
        setTodos(currentTodos => {
          const newTodos = [...currentTodos];
          const index = newTodos.findIndex(todo => todo.id === updatedTodo.id);

          newTodos.splice(index, 1, updatedTodo);

          return newTodos;
        });
      })
      .catch(() => {
        setErrorMessage('Unable to update todo');
      })
      .finally(() => {
        setLoadingTodoId(prevIds =>
          prevIds.filter(id => id !== updatedTodo.id),
        );
      });
  }

  function deleteTodo(todoId: number) {
    setLoadingTodoId(prevIds => [...prevIds, todoId]);
    deleteTodos(todoId)
      .then(() => {
        setTodos(currentTodos =>
          currentTodos.filter(todo => todo.id !== todoId),
        );
      })
      .catch(() => {
        setErrorMessage('Unable to delete a todo');
      })
      .finally(() => {
        setLoadingTodoId(prevIds => prevIds.filter(id => id !== todoId));
      });
  }

  const toggleTodoCompleted = (todoId: number) => {
    const todo = todos.find(t => t.id === todoId);

    if (todo) {
      const updateTodo = { ...todo, completed: !todo.completed };

      setLoadingTodoId(prevIds => [...prevIds, todoId]);

      updateTodos(updateTodo)
        .then(() => {
          setTodos(currentTodos =>
            currentTodos.map(t => (t.id === todoId ? updateTodo : t)),
          );
        })
        .catch(() => {
          setErrorMessage('Unable to update a todo');
        })
        .finally(() => {
          setLoadingTodoId(prevIds => prevIds.filter(id => id !== todoId));
        });
    }
  };

  const deleteCompletedTodos = () => {
    const completedTodos = todos.filter(todo => todo.completed);

    completedTodos.forEach(todo => {
      setLoadingTodoId(prevIds => [...prevIds, todo.id]);
      deleteTodos(todo.id)
        .then(() => {
          setTodos(currentTodos => currentTodos.filter(t => t.id !== todo.id));
        })
        .catch(() => {
          setErrorMessage('Unable to delete a todo');
        })
        .finally(() => {
          setLoadingTodoId(prevIds => prevIds.filter(id => id !== todo.id));
        });
    });
  };

  const handleAddTodo = (event: React.FormEvent) => {
    setIsSubmitting(true);
    event.preventDefault();
    addTodo({ title: newTodosTitle, userId: USER_ID, completed: false });
  };

  const toggleAllTodos = () => {
    const allCompleted = todos.every(todo => todo.completed);
    const newStatus = !allCompleted;
    const updatedTodos: Todo[] = [];

    todos.forEach(todo => {
      if (todo.completed === newStatus) {
        return;
      }

      updatedTodos.push({
        ...todo,
        completed: newStatus,
      });
    });
    updatedTodos.forEach(todo => {
      updateTodos(todo)
        .then(todoEach => {
          setTodos(prevTodos =>
            prevTodos.map(prevTodo => {
              if (prevTodo.id === todoEach.id) {
                return todoEach;
              }

              return prevTodo;
            }),
          );
        })
        .catch(() => {
          setErrorMessage('Unable to update todos');
        });
    });
  };

  const filteredTodos = getFilteredTodos(todos, filter);

  return (
    <div className="todoapp">
      <h1 className="todoapp__title">todos</h1>
      <div className="todoapp__content">
        <TodoHeader
          todos={todos}
          newTodosTitle={newTodosTitle}
          setNewTodos={setNewTodosTitle}
          handleAddTodo={handleAddTodo}
          inputRef={inputRef}
          isSubmitting={isSubmitting}
          toggleAllTodos={toggleAllTodos}
        />
        <TodoList
          todos={filteredTodos}
          deleteTodo={deleteTodo}
          fakeTodo={fakeTodo}
          loadingTodoId={loadingTodoId}
          toggleTodoCompleted={toggleTodoCompleted}
          setEditingTitle={setEditingTitle}
          setEditingTodoId={setEditingTodoId}
          updateTodo={updateTodoo}
          editingTodoId={editingTodoId}
          editingTitle={editingTitle}
        />
        {!!todos.length && (
          <TodoFooter
            todos={todos}
            filter={filter}
            setFilter={setFilter}
            deleteCompletedTodos={deleteCompletedTodos}
          />
        )}
      </div>
      <TodoErrors
        errorMessage={errorMessage}
        setErrorMessage={setErrorMessage}
      />
    </div>
  );
};