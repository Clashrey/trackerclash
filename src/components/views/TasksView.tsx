import React from 'react'
import { useAppStore } from '@/store'
import { TaskItem } from '@/components/TaskItem'
import { AddTaskForm } from '@/components/AddTaskForm'

export const TasksView: React.FC = () => {
  const { tasks } = useAppStore()
  
  const tasksList = tasks
    .filter(task => task.category === 'tasks')
    .sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">📝 Задачи</h2>
        <span className="text-sm text-muted-foreground">
          {tasksList.length} {tasksList.length === 1 ? 'задача' : 'задач'}
        </span>
      </div>

      <div className="space-y-3">
        {tasksList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-4xl mb-4">📝</div>
            <p className="text-lg mb-2">Задач пока нет</p>
            <p className="text-sm">Добавьте задачи, которые нужно выполнить</p>
          </div>
        ) : (
          tasksList.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))
        )}
      </div>

      <AddTaskForm 
        category="tasks" 
        placeholder="Добавить новую задачу..."
      />
    </div>
  )
}

