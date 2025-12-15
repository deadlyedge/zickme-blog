// UI-related types and interfaces

// Component props types
export interface BaseComponentProps {
	className?: string
	children?: React.ReactNode
}

export interface CardTiltProps extends BaseComponentProps {
	tiltMaxAngle?: number
	scale?: number
	children: React.ReactNode
}

export interface CardTiltContentProps extends BaseComponentProps {
	children: React.ReactNode
}

// Form types
export interface FormFieldProps {
	name: string
	label?: string
	error?: string
	required?: boolean
	disabled?: boolean
}

// Modal and dialog types
export interface ModalProps extends BaseComponentProps {
	isOpen: boolean
	onClose: () => void
	title?: string
	children: React.ReactNode
}

// Navigation types
export interface NavigationLinkProps extends BaseComponentProps {
	href: string
	children: React.ReactNode
	active?: boolean
}

// Animation types
export interface AnimatedContainerProps extends BaseComponentProps {
	delay?: number
	duration?: number
	children: React.ReactNode
}

// Layout types
export interface SectionProps extends BaseComponentProps {
	id?: string
	title?: string
	subtitle?: string
	children: React.ReactNode
}

// Button variants and sizes
export type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
export type ButtonSize = 'default' | 'sm' | 'lg' | 'icon'

// Theme types
export type Theme = 'light' | 'dark' | 'system'

// Loading states
export interface LoadingState {
	isLoading: boolean
	message?: string
}

// Error states
export interface ErrorState {
	hasError: boolean
	message?: string
	error?: Error
}

// Type guards for UI components
export function isValidButtonVariant(variant: string): variant is ButtonVariant {
	const validVariants: ButtonVariant[] = ['default', 'destructive', 'outline', 'secondary', 'ghost', 'link']
	return validVariants.includes(variant as ButtonVariant)
}

export function isValidButtonSize(size: string): size is ButtonSize {
	const validSizes: ButtonSize[] = ['default', 'sm', 'lg', 'icon']
	return validSizes.includes(size as ButtonSize)
}
