import dailyImage from '../../assets/images/home/daily.png'
import daily2Image from '../../assets/images/home/daily2.png'
import foodImage from '../../assets/images/home/food.png'
import food2Image from '../../assets/images/home/food2.png'
import energyImage from '../../assets/images/home/energy.png'
import healthyHabitsImage from '../../assets/images/home/Healthyhabits.png'

export const featureCards = [
  {
    title: 'Find a diet you love',
    text: 'Build a routine with personalized nutrition suggestions and simple meal ideas that match your daily rhythm.',
    accent: 'Salad plans',
    image: foodImage,
    imageClass: 'feature-card__icon-image--food',
  },
  {
    title: 'Start a simplified meal plan',
    text: 'Move from goals to practical meals with balanced menus, recipes, and snack ideas in one place.',
    accent: 'Smart planner',
    image: food2Image,
    imageClass: 'feature-card__icon-image--food2',
  },
  {
    title: 'Track your way to success',
    text: 'Follow meals, water, and daily habits with lightweight tools that help you stay consistent.',
    accent: 'Daily tracking',
    image: daily2Image,
    imageClass: 'feature-card__icon-image--daily2',
  },
  {
    title: 'Start your own healthy journey',
    text: 'Choose a pace that fits your lifestyle and grow it into a routine that feels sustainable.',
    accent: 'Healthy steps',
    image: dailyImage,
    imageClass: 'feature-card__icon-image--daily',
  },
]

export const benefitItems = [
  'Improved physical health',
  'Better mental health',
  'Increased longevity',
  'Weight management',
  'Improved self-confidence',
  'Reduced stress',
]

export const plans = ['Losing weight', 'Gaining weight', 'Maintaining weight']

export const storyCards = [
  {
    image: healthyHabitsImage,
    text: 'Healthy habits start with one calm decision every day.',
    alt: 'Healthy habits illustration',
  },
  {
    image: foodImage,
    text: 'Balanced meals become easier when the plan is clear.',
    alt: 'Balanced meal illustration',
  },
  {
    image: energyImage,
    text: 'Small progress compounds into confidence and energy.',
    alt: 'Confidence and energy illustration',
  },
]
