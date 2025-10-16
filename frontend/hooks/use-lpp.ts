"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  createLpp,
  getAllLpp,
  getLppById,
  updateLpp,
  deleteLpp,
  addDetail,
  // updateDetail,
  // deleteDetail,
  updateStatus,
  // uploadFoto,
  deleteFoto,
} from "@/lib/action/lpp/action-lpp";
import {
  CreateLppForm,
  UpdateLppForm,
  Detail,
  // UpdateDetail,
  LppId,
  // DetailId,
  FotoId,
  UpdateStatus,
  LppQueryParams,
  // UploadFotoForm,
} from "@/types/types-lpp";

// ✅ GET ALL LPP (list dengan pagination)
export function useLppList(params?: LppQueryParams) {
  return useQuery({
    queryKey: ["lpp", params],
    queryFn: () => getAllLpp(params),
    placeholderData: (previousData) => previousData, // ✅ pengganti keepPreviousData
  });
}

// ✅ GET LPP by ID
export function useLppById(id?: string) {
  return useQuery({
    queryKey: ["lpp", id],
    queryFn: () => (id ? getLppById({ id }) : Promise.resolve(null)),
    enabled: !!id,
  });
}

// ✅ CREATE
export function useCreateLpp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateLppForm) => createLpp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lpp"] });
    },
  });
}

// ✅ UPDATE
export function useUpdateLpp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateLppForm }) =>
      updateLpp(id, data),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["lpp"] });
      queryClient.invalidateQueries({ queryKey: ["lpp", id] });
    },
  });
}

// ✅ DELETE
export function useDeleteLpp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: LppId) => deleteLpp(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lpp"] });
    },
  });
}

// ✅ ADD DETAIL
export function useAddDetail() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ lppId, detail }: { lppId: string; detail: Detail }) =>
      addDetail(lppId, detail),
    onSuccess: (_, { lppId }) => {
      queryClient.invalidateQueries({ queryKey: ["lpp", lppId] });
    },
  });
}

// ✅ UPDATE DETAIL
// export function useUpdateDetail() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: ({ ids, detail }: { ids: DetailId; detail: UpdateDetail }) =>
//       updateDetail(ids, detail),
//     onSuccess: (_, { ids }) => {
//       queryClient.invalidateQueries({ queryKey: ["lpp", ids.id] });
//     },
//   });
// }

// // ✅ DELETE DETAIL
// export function useDeleteDetail() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: (ids: DetailId) => deleteDetail(ids),
//     onSuccess: (_, ids) => {
//       queryClient.invalidateQueries({ queryKey: ["lpp", ids.id] });
//     },
//   });
// }

// ✅ UPDATE STATUS
export function useUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      statusData,
    }: {
      id: string;
      statusData: UpdateStatus;
    }) => updateStatus(id, statusData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["lpp"] });
      queryClient.invalidateQueries({ queryKey: ["lpp", id] });
    },
  });
}

// ✅ UPLOAD FOTO
// export function useUploadFoto() {
//   const queryClient = useQueryClient();
//   return useMutation({
//     mutationFn: ({
//       lppId,
//       file,
//       data,
//     }: {
//       lppId: string;
//       file: File;
//       data: UploadFotoForm;
//     }) => uploadFoto(lppId, file, data),
//     onSuccess: (_, { lppId }) => {
//       queryClient.invalidateQueries({ queryKey: ["lpp", lppId] });
//     },
//   });
// }

// ✅ DELETE FOTO
export function useDeleteFoto() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: FotoId) => deleteFoto(ids),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["lpp"] });
    },
  });
}
