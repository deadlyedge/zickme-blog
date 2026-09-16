'use client'

import useEmblaCarousel, {
	type UseEmblaCarouselType,
} from 'embla-carousel-react'
import { ArrowLeft, ArrowRight } from 'lucide-react'
import * as React from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export type CarouselApi = UseEmblaCarouselType[1]
type UseCarouselParameters = Parameters<typeof useEmblaCarousel>
type CarouselOptions = UseCarouselParameters[0]
type CarouselPlugin = UseCarouselParameters[1]

type CarouselProps = {
	opts?: CarouselOptions
	plugins?: CarouselPlugin
	orientation?: 'horizontal' | 'vertical'
	setApi?: (api: CarouselApi) => void
}

type CarouselContextProps = {
	carouselRef: ReturnType<typeof useEmblaCarousel>[0]
	api: CarouselApi
	scrollPrev: () => void
	scrollNext: () => void
	canScrollPrev: boolean
	canScrollNext: boolean
	orientation: 'horizontal' | 'vertical'
}

const CarouselContext = React.createContext<CarouselContextProps | null>(null)

function useCarousel() {
	const context = React.useContext(CarouselContext)
	if (!context) throw new Error('useCarousel must be used within a <Carousel />')
	return context
}

function Carousel({
	orientation = 'horizontal',
	opts,
	setApi,
	plugins,
	className,
	children,
	...props
}: React.ComponentProps<'div'> & CarouselProps) {
	const [carouselRef, api] = useEmblaCarousel(
		{ ...opts, axis: orientation === 'horizontal' ? 'x' : 'y' },
		plugins,
	)
	const [canScrollPrev, setCanScrollPrev] = React.useState(false)
	const [canScrollNext, setCanScrollNext] = React.useState(false)

	const onSelect = React.useCallback((emblaApi: CarouselApi) => {
		if (!emblaApi) return
		setCanScrollPrev(emblaApi.canScrollPrev())
		setCanScrollNext(emblaApi.canScrollNext())
	}, [])

	React.useEffect(() => {
		if (!api) return
		setApi?.(api)
		onSelect(api)
		api.on('reInit', onSelect).on('select', onSelect)
		return () => {
			api.off('select', onSelect).off('reInit', onSelect)
		}
	}, [api, onSelect, setApi])

	const context = React.useMemo<CarouselContextProps>(() => ({
		carouselRef,
		api,
		scrollPrev: () => api?.scrollPrev(),
		scrollNext: () => api?.scrollNext(),
		canScrollPrev,
		canScrollNext,
		orientation,
	}), [api, canScrollNext, canScrollPrev, carouselRef, orientation])

	return (
		<CarouselContext.Provider value={context}>
			<div
				role="region"
				aria-roledescription="carousel"
				data-slot="carousel"
				className={cn('relative', className)}
				{...props}
			>
				{children}
			</div>
		</CarouselContext.Provider>
	)
}

function CarouselContent({ className, ...props }: React.ComponentProps<'div'>) {
	const { carouselRef, orientation } = useCarousel()
	return (
		<div ref={carouselRef} className="overflow-hidden">
			<div
				data-slot="carousel-content"
				className={cn(
					'flex',
					orientation === 'horizontal' ? '-ml-4' : '-mt-4 flex-col',
					className,
				)}
				{...props}
			/>
		</div>
	)
}

function CarouselItem({ className, ...props }: React.ComponentProps<'div'>) {
	const { orientation } = useCarousel()
	return (
		<div
			role="group"
			aria-roledescription="slide"
			data-slot="carousel-item"
			className={cn(
				'min-w-0 shrink-0 grow-0 basis-full',
				orientation === 'horizontal' ? 'pl-4' : 'pt-4',
				className,
			)}
			{...props}
		/>
	)
}

function CarouselPrevious({ className, ...props }: React.ComponentProps<typeof Button>) {
	const { orientation, scrollPrev, canScrollPrev } = useCarousel()
	return (
		<Button
			type="button"
			variant="outline"
			size="icon"
			data-slot="carousel-previous"
			className={cn(
				'absolute size-8 rounded-full',
				orientation === 'horizontal' ? 'left-2 top-1/2 -translate-y-1/2' : 'top-2 left-1/2 -translate-x-1/2 rotate-90',
				className,
			)}
			disabled={!canScrollPrev}
			onClick={scrollPrev}
			{...props}
		>
			<ArrowLeft />
			<span className="sr-only">上一项</span>
		</Button>
	)
}

function CarouselNext({ className, ...props }: React.ComponentProps<typeof Button>) {
	const { orientation, scrollNext, canScrollNext } = useCarousel()
	return (
		<Button
			type="button"
			variant="outline"
			size="icon"
			data-slot="carousel-next"
			className={cn(
				'absolute size-8 rounded-full',
				orientation === 'horizontal' ? 'right-2 top-1/2 -translate-y-1/2' : 'bottom-2 left-1/2 -translate-x-1/2 rotate-90',
				className,
			)}
			disabled={!canScrollNext}
			onClick={scrollNext}
			{...props}
		>
			<ArrowRight />
			<span className="sr-only">下一项</span>
		</Button>
	)
}

export { Carousel, CarouselContent, CarouselItem, CarouselNext, CarouselPrevious, useCarousel }