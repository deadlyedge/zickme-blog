import { AboutHeroSettings } from './AboutHeroSettings'
import { CareerTimelineSettings } from './CareerTimelineSettings'
import { FeaturedProjectsSettings } from './FeaturedProjectsSettings'
import { SiteProfileSettings } from './SiteProfileSettings'
import { SkillsSettings } from './SkillsSettings'
import { SlogansSettings } from './SlogansSettings'
import type { SettingsTabsProps } from './types'

type AboutSettingsProps = Pick<
	SettingsTabsProps,
	| 'aboutHeadline'
	| 'aboutSubheadline'
	| 'aboutStatusText'
	| 'careerTimeline'
	| 'featuredProjects'
	| 'setAboutHeadline'
	| 'setAboutSubheadline'
	| 'setAboutStatusText'
	| 'setCareerTimeline'
	| 'setFeaturedProjects'
	| 'addCareerItem'
	| 'addFeaturedProject'
	| 'name'
	| 'title'
	| 'bio'
	| 'avatar'
	| 'location'
	| 'email'
	| 'website'
	| 'skills'
	| 'slogans'
	| 'setName'
	| 'setTitle'
	| 'setBio'
	| 'setAvatar'
	| 'setLocation'
	| 'setEmail'
	| 'setWebsite'
	| 'updateSlogan'
	| 'addSlogan'
	| 'removeSlogan'
	| 'updateSkill'
	| 'updateTechnology'
	| 'addSkill'
	| 'removeSkill'
	| 'addTechnology'
	| 'removeTechnology'
>

export function AboutSettings({
	aboutHeadline,
	aboutSubheadline,
	aboutStatusText,
	careerTimeline,
	featuredProjects,
	setAboutHeadline,
	setAboutSubheadline,
	setAboutStatusText,
	setCareerTimeline,
	setFeaturedProjects,
	addCareerItem,
	addFeaturedProject,
	name,
	title,
	bio,
	avatar,
	location,
	email,
	website,
	skills,
	slogans,
	setName,
	setTitle,
	setBio,
	setAvatar,
	setLocation,
	setEmail,
	setWebsite,
	updateSlogan,
	addSlogan,
	removeSlogan,
	updateSkill,
	updateTechnology,
	addSkill,
	removeSkill,
	addTechnology,
	removeTechnology,
}: AboutSettingsProps) {
	return (
		<>
			<AboutHeroSettings
				headline={aboutHeadline}
				subheadline={aboutSubheadline}
				statusText={aboutStatusText}
				onHeadlineChange={setAboutHeadline}
				onSubheadlineChange={setAboutSubheadline}
				onStatusTextChange={setAboutStatusText}
			/>
			<SiteProfileSettings
				name={name}
				title={title}
				avatar={avatar}
				location={location}
				email={email}
				website={website}
				bio={bio}
				onNameChange={setName}
				onTitleChange={setTitle}
				onAvatarChange={setAvatar}
				onLocationChange={setLocation}
				onEmailChange={setEmail}
				onWebsiteChange={setWebsite}
				onBioChange={setBio}
			/>

			<SlogansSettings
				slogans={slogans}
				updateSlogan={updateSlogan}
				addSlogan={addSlogan}
				removeSlogan={removeSlogan}
			/>
			<SkillsSettings
				skills={skills}
				updateSkill={updateSkill}
				updateTechnology={updateTechnology}
				addSkill={addSkill}
				removeSkill={removeSkill}
				addTechnology={addTechnology}
				removeTechnology={removeTechnology}
			/>
			<CareerTimelineSettings
				careerTimeline={careerTimeline}
				setCareerTimeline={setCareerTimeline}
				addCareerItem={addCareerItem}
			/>
			<FeaturedProjectsSettings
				featuredProjects={featuredProjects}
				setFeaturedProjects={setFeaturedProjects}
				addFeaturedProject={addFeaturedProject}
			/>
		</>
	)
}
