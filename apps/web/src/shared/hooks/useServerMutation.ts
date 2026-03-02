import { useCallback, useRef } from "react";
import { useMutation } from "@tanstack/react-query";

type ServerMutationContext = {
  signal: AbortSignal;
};

type UseServerMutationOptions<TVariables, TResult, TSnapshot> = {
  mutationFn: (
    variables: TVariables,
    context: ServerMutationContext,
  ) => Promise<TResult>;
  onMutate?: (variables: TVariables) => Promise<TSnapshot> | TSnapshot;
  onSuccess?: (
    result: TResult,
    variables: TVariables,
    snapshot: TSnapshot | undefined,
  ) => Promise<void> | void;
  onError?: (
    error: unknown,
    variables: TVariables,
    snapshot: TSnapshot | undefined,
  ) => Promise<void> | void;
  cancelInFlightOnMutate?: boolean;
};

type UseServerMutationResult<TVariables, TResult> = {
  mutate: (variables: TVariables) => Promise<TResult | undefined>;
  cancel: () => void;
  isPending: boolean;
};

function isAbortError(error: unknown): boolean {
  return error instanceof Error && error.name === "AbortError";
}

export function useServerMutation<
  TVariables,
  TResult,
  TSnapshot = undefined,
>({
  mutationFn,
  onMutate,
  onSuccess,
  onError,
  cancelInFlightOnMutate = true,
}: UseServerMutationOptions<TVariables, TResult, TSnapshot>): UseServerMutationResult<
  TVariables,
  TResult
> {
  const activeControllerRef = useRef<AbortController | null>(null);

  const cancel = useCallback(() => {
    const activeController = activeControllerRef.current;
    if (!activeController || activeController.signal.aborted) {
      return;
    }

    activeController.abort();
  }, []);

  const mutation = useMutation<TResult, unknown, TVariables, TSnapshot | undefined>({
    mutationFn: async (variables) => {
      if (cancelInFlightOnMutate) {
        cancel();
      }

      const controller = new AbortController();
      activeControllerRef.current = controller;

      try {
        return await mutationFn(variables, { signal: controller.signal });
      } finally {
        if (activeControllerRef.current === controller) {
          activeControllerRef.current = null;
        }
      }
    },
    onMutate,
    onSuccess,
    onError: async (error, variables, snapshot) => {
      if (isAbortError(error)) {
        return;
      }

      if (onError) {
        await onError(error, variables, snapshot);
      }
    },
  });

  const mutate = useCallback(
    async (variables: TVariables): Promise<TResult | undefined> => {
      try {
        return await mutation.mutateAsync(variables);
      } catch (error) {
        if (isAbortError(error)) {
          return undefined;
        }

        throw error;
      }
    },
    [mutation],
  );

  return {
    mutate,
    cancel,
    isPending: mutation.isPending,
  };
}
