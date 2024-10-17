import { useState } from "react";

interface TagFilterProps {
  activeTags: string[];
  setActiveTags: (tags: string[]) => void;
}

const TagFilter = ({ activeTags = [], setActiveTags }: TagFilterProps) => {
  const [removedTags, setRemovedTags] = useState<string[]>([]);

  const removeTag = (tag: string) => {
    setActiveTags(activeTags.filter((t) => t !== tag));
    setRemovedTags([...removedTags, tag]);
  };

  const restoreTag = (tag: string) => {
    setRemovedTags(removedTags.filter((t) => t !== tag));
    setActiveTags([...activeTags, tag]);
  };

  return (
    <div>
      <div>
        {activeTags.map((tag) => (
          <div
            key={tag}
            className="badge badge-info gap-2"
            onClick={() => removeTag(tag)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block h-4 w-4 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
            {tag} km
          </div>
        ))}
      </div>
      <div>
        {removedTags.map((tag) => (
          <div
            key={tag}
            className="badge badge-error gap-2"
            onClick={() => restoreTag(tag)}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              className="inline-block h-4 w-4 stroke-current"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M6 18L18 6M6 6l12 12"
              ></path>
            </svg>
            {tag} km
          </div>
        ))}
      </div>
    </div>
  );
};

export default TagFilter;
