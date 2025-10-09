import { API_BASE_URL } from '@/config/api';


export interface PageContent {
  id: string;
  title: string;
  content: string;
}

// Fetch all active subscription plans
export const fetchPageData = async (id: string): Promise<PageContent> => {
  const response = await fetch(`${API_BASE_URL}/pages/${id}`);
  if (!response.ok) {
    throw new Error("Failed to fetch page");
  }
  const result = await response.json();
  return result.data; // single object
};

export const savePageData = async (page: PageContent): Promise<PageContent> => {
  const response = await fetch(`${API_BASE_URL}/pages/${page.id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(page),
  });
  

  if (!response.ok) {
    throw new Error("Failed to save page");
  }

  const result = await response.json();
  return result.data;
};
