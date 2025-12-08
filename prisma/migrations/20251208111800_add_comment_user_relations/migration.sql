-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_editedBy_fkey" FOREIGN KEY ("editedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Comment" ADD CONSTRAINT "Comment_deletedBy_fkey" FOREIGN KEY ("deletedBy") REFERENCES "user"("id") ON DELETE SET NULL ON UPDATE CASCADE;
