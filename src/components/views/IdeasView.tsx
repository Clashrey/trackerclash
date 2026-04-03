import React from 'react'
import { Lightbulb } from 'lucide-react'
import { ListView } from './ListView'

export const IdeasView: React.FC = () => {
  return (
    <ListView
      category="ideas"
      title="Идеи"
      emptyIcon={<Lightbulb className="w-12 h-12" />}
      emptyTitle="Идей пока нет"
      emptyDescription="Записывайте мысли и планы, чтобы не забыть"
      placeholder="Добавить новую идею..."
    />
  )
}
