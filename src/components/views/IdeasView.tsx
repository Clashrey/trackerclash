import React from 'react'
import { useAppStore } from '@/store'
import { TaskItem } from '@/components/TaskItem'
import { AddTaskForm } from '@/components/AddTaskForm'

export const IdeasView: React.FC = () => {
  const { tasks } = useAppStore()
  
  const ideasList = tasks
    .filter(task => task.category === 'ideas')
    .sort((a, b) => a.order_index - b.order_index)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">💡 Идеи</h2>
        <span className="text-sm text-muted-foreground">
          {ideasList.length} {ideasList.length === 1 ? 'идея' : 'идей'}
        </span>
      </div>

      <div className="space-y-3">
        {ideasList.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <div className="text-4xl mb-4">💡</div>
            <p className="text-lg mb-2">Идей пока нет</p>
            <p className="text-sm">Записывайте сюда свои идеи и планы</p>
          </div>
        ) : (
          ideasList.map((task) => (
            <TaskItem key={task.id} task={task} />
          ))
        )}
      </div>

      <AddTaskForm 
        category="ideas" 
        placeholder="Добавить новую идею..."
      />
    </div>
  )
}

