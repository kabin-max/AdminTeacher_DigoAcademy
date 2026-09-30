-- CreateTable
CREATE TABLE "GoogleMeetConnection" (
    "id" TEXT NOT NULL DEFAULT 'singleton',
    "accountEmail" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "connectedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GoogleMeetConnection_pkey" PRIMARY KEY ("id")
);
