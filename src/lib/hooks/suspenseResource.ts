export function createResource(fetcher: () => Promise<any>) {
  let status = "pending";
  let result: any;
  const suspender = fetcher().then(
    r => {
      status = "success";
      result = r;
    },
    e => {
      status = "error";
      result = e;
    }
  );
  return {
    read() {
      if (status === "pending") throw suspender;
      if (status === "error") throw result;
      return result;
    }
  };
} 