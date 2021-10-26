import { Column, Entity, PrimaryColumn } from 'typeorm';

@Entity('AMEClientTools_Coverage_Result_CLINotSupportedResources')
export class CliNotSupportedResource {
    @PrimaryColumn()
    fullResourceType: string;
    @Column({ nullable: true })
    fileName: string;
}
