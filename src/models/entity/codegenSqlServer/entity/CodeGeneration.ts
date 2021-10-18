import { Column, Entity, Index, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class CodeGeneration {
    @PrimaryGeneratedColumn()
    id: number;
    @Index({ unique: true })
    @Column()
    name: string;
    @Column()
    resourceProvider: string;
    @Column()
    serviceType: string;
    @Column({ nullable: true })
    resourcesToGenerate: string;
    @Column({ nullable: true })
    tag: string;
    @Column({ nullable: true })
    sdk: string;
    @Column({ nullable: true })
    swaggerRepo: string;
    @Column({ nullable: true })
    sdkRepo: string;
    @Column({ nullable: true })
    codegenRepo: string;
    @Column({ nullable: true })
    type: string;
    @Column({ nullable: true })
    ignoreFailure: string;
    @Column({ nullable: true })
    stages: string;
    @Column({ nullable: true })
    lastPipelineBuildID: string;
    @Column({ nullable: true })
    swaggerPR: string;
    @Column({ nullable: true })
    codePR: string;
    @Column({ nullable: true })
    status: string;
    @Column({ nullable: true })
    owner: string;
}
