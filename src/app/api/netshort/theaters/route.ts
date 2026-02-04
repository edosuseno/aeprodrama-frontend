import { safeJson, encryptedResponse, getBackendBase } from "@/lib/api-utils";
import { NextResponse } from "next/server";

const UPSTREAM_API = getBackendBase() + "/netshort";

export async function GET() {
  try {
    const response = await fetch(`${UPSTREAM_API}/theaters`, {
      cache: 'no-store',
    });

    if (!response.ok) {
      return encryptedResponse({ success: false, data: [] });
    }

    const data = await safeJson<any>(response);

    const normalizedGroups = (data || []).map((group: any) => ({
      groupId: group.groupId,
      groupName: group.contentName,
      contentRemark: group.contentRemark,
      dramas: (group.contentInfos || []).map((item: any) => ({
        shortPlayId: item.shortPlayId,
        shortPlayLibraryId: item.shortPlayLibraryId,
        title: item.shortPlayName,
        cover: item.shortPlayCover || item.groupShortPlayCover,
        labels: item.labelArray || [],
        heatScore: item.heatScoreShow || "",
        scriptName: item.scriptName,
        totalEpisodes: item.totalEpisode || 0,
      })),
    }));

    return encryptedResponse({
      success: true,
      data: normalizedGroups,
    });
  } catch (error) {
    console.error("NetShort Theaters Error:", error);
    return encryptedResponse({ success: false, data: [] });
  }
}
