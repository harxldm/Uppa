import React from 'react'

const GRADE_CLASSES = {
  A: 'nutri-a',
  B: 'nutri-b',
  C: 'nutri-c',
  D: 'nutri-d',
  E: 'nutri-e',
}

/**
 * NutriScoreBadge
 * @param {{ grade: string|null }} props
 */
export default function NutriScoreBadge({ grade }) {
  const key = (grade || '').toUpperCase()
  const cls = GRADE_CLASSES[key] || 'nutri-unknown'
  const label = key || '?'

  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${cls}`}
      title={`Nutri-Score ${label}`}
    >
      <span className="opacity-70 text-[10px]">Nutri-Score</span>
      <span className="text-sm">{label}</span>
    </span>
  )
}
