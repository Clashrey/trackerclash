import React from 'react'
import { ListTodo } from 'lucide-react'
import { ListView } from './ListView'

export const TasksView: React.FC = () => {
  return (
    <ListView
      category="tasks"
      title="Задачи"
      emptyIcon={<ListTodo className="w-12 h-12" />}
      emptyTitle="Список задач пуст"
      emptyDescription="Создайте задачи для долгосрочного планирования"
      placeholder="Добавить новую задачу..."
      showMoveToToday={true}
    />
  )
}
