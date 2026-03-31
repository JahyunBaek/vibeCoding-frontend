import { apiRequest, client } from "@/lib/client";
import type { ApiResponse } from "@/types/api";

export const boardApi = {
  // Board admin
  boardsAdminList: (page = 1, size = 20, tenantId?: number | null) => {
    const q = new URLSearchParams({ page: String(page), size: String(size) });
    if (tenantId) q.set("tenantId", String(tenantId));
    return apiRequest<any>("GET", `/api/admin/boards?${q}`);
  },
  boardsAdminCreate: (name: string, description?: string, useYn = true, tenantId?: number | null) =>
    apiRequest<number>("POST", "/api/admin/boards", { name, description, useYn, tenantId }),
  boardsAdminUpdate: (boardId: number, name: string, description?: string, useYn = true) =>
    apiRequest<void>("PUT", `/api/admin/boards/${boardId}`, { name, description, useYn }),
  boardsAdminDelete: (boardId: number) => apiRequest<void>("DELETE", `/api/admin/boards/${boardId}`),

  // Posts
  postsList: (boardId: string, page = 1, size = 10, search?: string) => {
    const params = new URLSearchParams({ page: String(page), size: String(size) });
    if (search) params.set("search", search);
    return apiRequest<any>("GET", `/api/boards/${boardId}/posts?${params}`);
  },
  postDetail: (boardId: string, postId: string) =>
    apiRequest<any>("GET", `/api/boards/${boardId}/posts/${postId}`),
  postCreate: (boardId: string, title: string, content: string, fileIds: number[], idempotencyKey?: string) =>
    apiRequest<number>("POST", `/api/boards/${boardId}/posts`, { title, content, fileIds },
      idempotencyKey ? { headers: { "Idempotency-Key": idempotencyKey } } : undefined),
  postUpdate: (boardId: string, postId: string, title: string, content: string, fileIds: number[]) =>
    apiRequest<void>("PUT", `/api/boards/${boardId}/posts/${postId}`, { title, content, fileIds }),
  postDelete: (boardId: string, postId: string) =>
    apiRequest<void>("DELETE", `/api/boards/${boardId}/posts/${postId}`),

  // Comments
  commentsList: (postId: string) => apiRequest<any[]>("GET", `/api/posts/${postId}/comments`),
  commentCreate: (postId: string, content: string) =>
    apiRequest<void>("POST", `/api/posts/${postId}/comments`, { content }),
  commentUpdate: (postId: string, commentId: number, content: string) =>
    apiRequest<void>("PUT", `/api/posts/${postId}/comments/${commentId}`, { content }),
  commentDelete: (postId: string, commentId: number) =>
    apiRequest<void>("DELETE", `/api/posts/${postId}/comments/${commentId}`),

  // Files
  fileUploadInlineImage: (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    return apiRequest<{ url: string }>("POST", "/api/files/image", formData, { isFormData: true });
  },
  fileUpload: async (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return apiRequest<{ fileId: number; originalName: string; sizeBytes: number }>("POST", "/api/files", fd, {
      isFormData: true,
    });
  },
  fileUploadWithProgress: async (
    file: File,
    onProgress: (pct: number) => void
  ): Promise<{ fileId: number; originalName: string; sizeBytes: number }> => {
    const fd = new FormData();
    fd.append("file", file);
    const res = await client.post<ApiResponse<{ fileId: number; originalName: string; sizeBytes: number }>>(
      "/api/files",
      fd,
      {
        onUploadProgress: (e) =>
          onProgress(e.total ? Math.round((e.loaded * 100) / e.total) : 0),
      }
    );
    if (!res.data?.success) throw new Error(res.data?.error?.message ?? "Upload failed");
    return res.data.data;
  },
  fileDelete: (fileId: number) => apiRequest<void>("DELETE", `/api/files/${fileId}`),
  fileDownload: async (fileId: number, fileName: string) => {
    const res = await client.get(`/api/files/${fileId}/download`, { responseType: "blob" });
    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  },
};
