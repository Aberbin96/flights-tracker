import { supabaseAdmin } from "@/utils/supabase/admin";

export interface ApiLimit {
  service: string;
  requests_limit: number | null;
  requests_remaining: number | null;
  reset_at: string | null;
  last_updated: string;
}

export class StatusService {
  /**
   * Updates or inserts a record in api_limits
   */
  static async updateLimit(limitData: Partial<ApiLimit> & { service: string }): Promise<void> {
    try {
      const { error } = await supabaseAdmin
        .from("api_limits")
        .upsert({
          ...limitData,
          last_updated: new Date().toISOString()
        }, { onConflict: "service" });

      if (error) {
        console.error(`[StatusService] Failed to update limit for ${limitData.service}:`, error);
      }
    } catch (error) {
      console.error(`[StatusService] Error in updateLimit for ${limitData.service}:`, error);
    }
  }

  /**
   * Retrieves all API limits
   */
  static async getAllLimits(): Promise<ApiLimit[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from("api_limits")
        .select("*")
        .order("service");

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("[StatusService] Failed to fetch all limits:", error);
      return [];
    }
  }
}
