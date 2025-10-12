import { useState, useEffect } from "react";
import { fetchAllProjects } from "@/lib/action/master/project";

interface Project {
  id: string;
  name: string;
  // add other fields here
}

interface FetchAllProjectsParams {
  customerId?: string;
  q?: string;
  take?: number;
  skip?: number;
}

export function useFetchProjects(params: FetchAllProjectsParams = {}) {
  const [projects, setProjects] = useState<Project[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const {
    customerId,
    q,
    take = 100, // default same as fetchAllProjects default
    skip = 0,
  } = params;

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    fetchAllProjects({ customerId, q, take, skip })
      .then((result) => {
        if (isMounted) {
          if (result.success) {
            setProjects(result.data);
            setTotal(result.total);
          } else {
            setError(result.message);
          }
          setIsLoading(false);
        }
      })
      .catch((e) => {
        if (isMounted) {
          setError(e instanceof Error ? e.message : String(e));
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [customerId, q, take, skip]);

  return { projects, total, isLoading, error };
}
