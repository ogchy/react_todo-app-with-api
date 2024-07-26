import classNames from 'classnames';
import React from 'react';
import { Todo } from '../types/Todo';

interface TodoHeaderProps {
  todos: Todo[];
  newTodosTitle: string;
  setNewTodos: (value: string) => void;
  handleAddTodo: (event: React.FormEvent) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  isSubmitting: boolean;
  toggleAllTodos: () => void;
}

export const TodoHeader: React.FC<TodoHeaderProps> = ({
  todos,
  newTodosTitle,
  setNewTodos,
  handleAddTodo,
  inputRef,
  isSubmitting,
  toggleAllTodos,
}) => {
  return (
    <header className="todoapp__header">
      {todos.length > 0 && (
        <button
          type="button"
          className={classNames('todoapp__toggle-all', {
            active: todos.every(todo => todo.completed) ? 'is-active' : '',
          })}
          data-cy="ToggleAllButton"
          onClick={toggleAllTodos}
        />
      )}

      {/* Add a todo on form submit */}
      <form onSubmit={handleAddTodo}>
        <input
          data-cy="NewTodoField"
          type="text"
          className="todoapp__new-todo"
          placeholder="What needs to be done?"
          value={newTodosTitle}
          onChange={e => setNewTodos(e.target.value)}
          ref={inputRef}
          disabled={isSubmitting}
        />
      </form>
    </header>
  );
};
