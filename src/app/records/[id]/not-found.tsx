import { LinkButton } from "@/components/ui";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-md py-20 text-center">
      <h1 className="text-lg font-semibold">제작건을 찾을 수 없습니다.</h1>
      <p className="mt-2 text-sm text-gray-500">
        삭제되었거나 잘못된 주소일 수 있습니다.
      </p>
      <div className="mt-6">
        <LinkButton href="/records">목록으로</LinkButton>
      </div>
    </div>
  );
}
