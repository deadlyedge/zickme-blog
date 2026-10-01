'use client'

import { useEffect, useRef, useState } from 'react'

export interface TocItem {
	id: string
	text: string
	level: number
}

/** Tracks article headings, active TOC state, scroll progress, and TOC navigation. */
export function usePostReadingExperience(markdownContent: string) {
	const scrollContainerRef = useRef<HTMLDivElement>(null)
	const articleContentRef = useRef<HTMLDivElement>(null)
	const [readingProgress, setReadingProgress] = useState(0)
	const [activeHeadingId, setActiveHeadingId] = useState('')
	const [tocItems, setTocItems] = useState<TocItem[]>([])

	useEffect(() => {
		if (!markdownContent || !articleContentRef.current) {
			setTocItems([])
			return
		}

		const headings =
			articleContentRef.current.querySelectorAll('h1, h2, h3, h4')
		const items: TocItem[] = []

		headings.forEach((heading, index) => {
			const text = heading.textContent || ''
			let id = heading.id
			if (!id) {
				id = `heading-${index}-${text
					.toLowerCase()
					.replace(/[^\w\u4e00-\u9fa5]+/g, '-')
					.replace(/^-+|-+$/g, '')}`
				heading.id = id
			}
			items.push({
				id,
				text,
				level: Number.parseInt(heading.tagName.replace('H', ''), 10),
			})
		})

		setTocItems(items)
	}, [markdownContent])

	useEffect(() => {
		const container = scrollContainerRef.current
		if (!container) return

		const handleScroll = () => {
			const { scrollTop, scrollHeight, clientHeight } = container
			const totalScrollable = scrollHeight - clientHeight
			if (totalScrollable > 0) {
				setReadingProgress(
					Math.min(100, Math.max(0, (scrollTop / totalScrollable) * 100)),
				)
			}

			if (!articleContentRef.current) return
			const headings = Array.from(
				articleContentRef.current.querySelectorAll('h1, h2, h3, h4'),
			)
			const containerTop = container.getBoundingClientRect().top
			let currentActiveId = ''
			for (const heading of headings) {
				if (heading.getBoundingClientRect().top - containerTop <= 120) {
					currentActiveId = heading.id
				} else {
					break
				}
			}
			if (currentActiveId) setActiveHeadingId(currentActiveId)
			else if (headings.length > 0 && headings[0].id)
				setActiveHeadingId(headings[0].id)
		}

		container.addEventListener('scroll', handleScroll, { passive: true })
		handleScroll()
		return () => container.removeEventListener('scroll', handleScroll)
	}, [])

	const handleScrollToHeading = (id: string) => {
		const element = document.getElementById(id)
		const container = scrollContainerRef.current
		if (!element || !container) return

		const containerRect = container.getBoundingClientRect()
		const elementRect = element.getBoundingClientRect()
		container.scrollTo({
			top: container.scrollTop + (elementRect.top - containerRect.top) - 80,
			behavior: 'smooth',
		})
		setActiveHeadingId(id)
	}

	return {
		articleContentRef,
		scrollContainerRef,
		readingProgress,
		activeHeadingId,
		tocItems,
		handleScrollToHeading,
	}
}
