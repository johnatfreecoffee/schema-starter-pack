import { useState } from 'react';
import SettingsTabs from '@/components/layout/SettingsTabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import ArticleList from '@/components/admin/kb/ArticleList';
import ArticleForm from '@/components/admin/kb/ArticleForm';
import ArticleView from '@/components/admin/kb/ArticleView';
import CategoryManager from '@/components/admin/kb/CategoryManager';

interface Article {
  id: string;
  title: string;
  content: string;
  category_id: string | null;
  tags: string[];
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
  kb_categories?: {
    name: string;
  } | null;
}

const KnowledgeBase = () => {
  const [showArticleForm, setShowArticleForm] = useState(false);
  const [showCategoryManager, setShowCategoryManager] = useState(false);
  const [showArticleView, setShowArticleView] = useState(false);
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  const handleCreateClick = () => {
    setSelectedArticle(null);
    setIsEditing(false);
    setShowArticleForm(true);
  };

  const handleViewClick = (article: Article) => {
    setSelectedArticle(article);
    setShowArticleView(true);
  };

  const handleEditClick = (article: Article) => {
    setSelectedArticle(article);
    setIsEditing(true);
    setShowArticleView(false);
    setShowArticleForm(true);
  };

  const handleEditFromView = () => {
    setIsEditing(true);
    setShowArticleView(false);
    setShowArticleForm(true);
  };

  const handleDeleteFromView = () => {
    setShowArticleView(false);
    // The delete will be handled by the ArticleView component via AlertDialog
  };

  return (
    <>
      <SettingsTabs />
      
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>AI Training Knowledge Base</CardTitle>
                <CardDescription>
                  Create and manage articles to train the AI about your business, services, processes, and unique information
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setShowCategoryManager(true)}>
                <Settings className="h-4 w-4 mr-2" />
                Manage Categories
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ArticleList
              onCreateClick={handleCreateClick}
              onViewClick={handleViewClick}
              onEditClick={handleEditClick}
            />
          </CardContent>
        </Card>
      </div>

      {/* Article Form Modal */}
      <ArticleForm
        open={showArticleForm}
        onOpenChange={setShowArticleForm}
        article={isEditing ? selectedArticle : null}
      />

      {/* Article View Modal */}
      <ArticleView
        open={showArticleView}
        onOpenChange={setShowArticleView}
        article={selectedArticle}
        onEdit={handleEditFromView}
        onDelete={handleDeleteFromView}
      />

      {/* Category Manager Modal */}
      <CategoryManager
        open={showCategoryManager}
        onOpenChange={setShowCategoryManager}
      />
    </>
  );
};

export default KnowledgeBase;