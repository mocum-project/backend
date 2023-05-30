export default interface RecipeType {
  id: number;
  name: string;
  viewCount: number;
  recommendCount: number;
  scrapCount: number;
  method: string;
  category: string;
  ingredients: string[];
  level: string;
  time: string;
}
