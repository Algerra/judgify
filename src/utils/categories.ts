export interface Category {
  id: string;
  label: string;
  emoji: string;
  color: string;
}

export const CATEGORIES: Category[] = [
  { id: 'relationship', label: 'Relationship', emoji: '💕', color: '#FF6B6B' },
  { id: 'friendship', label: 'Friendship', emoji: '👯', color: '#4ECDC4' },
  { id: 'work', label: 'Work', emoji: '💼', color: '#45B7D1' },
  { id: 'family', label: 'Family', emoji: '👨‍👩‍👧', color: '#96CEB4' },
  { id: 'roommate', label: 'Roommate', emoji: '🏠', color: '#FFEAA7' },
  { id: 'other', label: 'Other', emoji: '🤷', color: '#888888' },
];

export const getCategoryById = (id: string): Category | undefined => {
  return CATEGORIES.find(cat => cat.id === id);
};
