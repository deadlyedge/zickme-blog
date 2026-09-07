import type React from 'react'

export interface SocialIconProps extends React.SVGProps<SVGSVGElement> {
	className?: string
	size?: number | string
}

export const GitHubIcon = ({
	size = 16,
	className,
	...props
}: SocialIconProps) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
		{...props}
	>
		<path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" />
		<path d="M9 18c-4.51 2-5-2-7-2" />
	</svg>
)

export const XTwitterIcon = ({
	size = 16,
	className,
	...props
}: SocialIconProps) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="currentColor"
		className={className}
		{...props}
	>
		<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
	</svg>
)

export const LinkedInIcon = ({
	size = 16,
	className,
	...props
}: SocialIconProps) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
		{...props}
	>
		<path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
		<rect width="4" height="12" x="2" y="9" />
		<circle cx="4" cy="4" r="2" />
	</svg>
)

export const InstagramIcon = ({
	size = 16,
	className,
	...props
}: SocialIconProps) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
		{...props}
	>
		<rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
		<path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
		<line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
	</svg>
)

export const YouTubeIcon = ({
	size = 16,
	className,
	...props
}: SocialIconProps) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
		{...props}
	>
		<path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17" />
		<path d="m10 15 5-3-5-3z" />
	</svg>
)

export const FacebookIcon = ({
	size = 16,
	className,
	...props
}: SocialIconProps) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
		{...props}
	>
		<path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
	</svg>
)

export const BilibiliIcon = ({
	size = 16,
	className,
	...props
}: SocialIconProps) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="none"
		stroke="currentColor"
		strokeWidth="2"
		strokeLinecap="round"
		strokeLinejoin="round"
		className={className}
		{...props}
	>
		<rect width="18" height="14" x="3" y="6" rx="3" />
		<path d="m7 2 3 4" />
		<path d="m17 2-3 4" />
		<line x1="9" x2="9.01" y1="12" y2="12" />
		<line x1="15" x2="15.01" y1="12" y2="12" />
	</svg>
)

export const ZhihuIcon = ({
	size = 16,
	className,
	...props
}: SocialIconProps) => (
	<svg
		width={size}
		height={size}
		viewBox="0 0 24 24"
		fill="currentColor"
		className={className}
		{...props}
	>
		<path d="M5.72 4.02h3.41v1.64H6.98c-.12 1.93-.36 3.65-.7 5.16h3.19v1.64H7.3c-.76 2.37-2.02 4.47-3.8 6.29l-1.07-1.32c1.47-1.47 2.51-3.19 3.13-5.16H3.34V4.02h2.38zm1.09 1.64H5.72v4.98c.36-1.5.57-3.16.68-4.98h.41zm6.91 0h5.67v8.52h-1.63v3.98l-3.37-3.98h-.67V5.66zm1.63 6.88h2.41V7.3h-2.41v5.24z" />
	</svg>
)

export function getSocialIcon(platform: string) {
	switch (platform) {
		case 'GitHub':
			return GitHubIcon
		case 'LinkedIn':
			return LinkedInIcon
		case 'Twitter':
		case 'X':
			return XTwitterIcon
		case 'Instagram':
			return InstagramIcon
		case 'YouTube':
			return YouTubeIcon
		case 'Facebook':
			return FacebookIcon
		case 'Bilibili':
			return BilibiliIcon
		case 'Zhihu':
			return ZhihuIcon
		default:
			return null
	}
}
