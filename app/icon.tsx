import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: 32,
          height: 32,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: "50%",
          background: "#4A7C59",
        }}
      >
        {/* outer circle stroke */}
        <div
          style={{
            position: "absolute",
            width: 22,
            height: 22,
            borderRadius: "50%",
            border: "1.5px solid #F5F3EF",
            display: "flex",
          }}
        />
      </div>
    ),
    { ...size }
  );
}
