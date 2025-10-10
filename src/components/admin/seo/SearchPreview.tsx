import { Card } from '@/components/ui/card';

interface SearchPreviewProps {
  title: string;
  description: string;
  url: string;
}

export const SearchPreview = ({ title, description, url }: SearchPreviewProps) => {
  const displayUrl = url.replace(/^https?:\/\//, '').replace(/\/$/, '');
  const displayTitle = title || 'Untitled Page';
  const displayDescription = description || 'No description provided';

  return (
    <div className="p-4 bg-white border rounded-md">
      <div className="space-y-1">
        <div className="text-sm text-blue-700">{displayUrl}</div>
        <div className="text-xl text-blue-600 hover:underline cursor-pointer">
          {displayTitle.length > 60 
            ? `${displayTitle.substring(0, 60)}...` 
            : displayTitle}
        </div>
        <div className="text-sm text-gray-600">
          {displayDescription.length > 160
            ? `${displayDescription.substring(0, 160)}...`
            : displayDescription}
        </div>
      </div>
    </div>
  );
};
