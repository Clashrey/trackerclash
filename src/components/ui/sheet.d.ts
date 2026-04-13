import * as React from 'react'

export function Sheet(props: React.ComponentProps<'div'> & { open?: boolean; onOpenChange?: (open: boolean) => void; children?: React.ReactNode }): React.JSX.Element
export function SheetTrigger(props: React.ComponentProps<'button'>): React.JSX.Element
export function SheetClose(props: React.ComponentProps<'button'>): React.JSX.Element
export function SheetPortal(props: { children?: React.ReactNode }): React.JSX.Element
export function SheetOverlay(props: React.ComponentProps<'div'>): React.JSX.Element
export function SheetContent(props: React.ComponentProps<'div'> & { side?: 'top' | 'right' | 'bottom' | 'left'; children?: React.ReactNode }): React.JSX.Element
export function SheetHeader(props: React.ComponentProps<'div'>): React.JSX.Element
export function SheetFooter(props: React.ComponentProps<'div'>): React.JSX.Element
export function SheetTitle(props: React.ComponentProps<'h2'>): React.JSX.Element
export function SheetDescription(props: React.ComponentProps<'p'>): React.JSX.Element
